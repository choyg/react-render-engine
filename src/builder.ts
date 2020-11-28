import { join } from 'path';
import Module from 'module';
import globby from 'globby';
import { basename } from 'path';
import * as fs from 'fs';
import webpack from 'webpack';

export class PageBuilder {
  private pageElements: Record<string, any> = {};
  constructor(private readonly options: PageBuilderOptions) {}

  async bundleSource() {
    // Webpack can create the directories, but we don't want to crash
    // if there are no globbed files
    this.options.publishFS.mkdirSync('/input-bundles');
    this.options.publishFS.mkdirSync('/input-bundles-cjs');

    // Find all component files
    const files = await globby(this.options.glob, {
      cwd: this.options.root,
      expandDirectories: true,
    });

    // Bundle source input
    const bundling = async (root: string, path: string) => {
      await this.bundle(root, path, '/input-bundles');
      await this.bundle(root, path, '/input-bundles-cjs', true);
    };
    await Promise.all(files.map((p) => bundling(this.options.root, p)));
    this.cacheSourceModules(files);
  }

  getPageNode(name: string) {
    return this.pageElements[name];
  }

  getPageBrowser(name: string) {
    const path = join('/input-bundles', name + '.js');
    return this.options.publishFS.readFileSync(path);
  }

  private cacheSourceModules(paths: string[]) {
    paths.forEach((p) => {
      const [name] = basename(p).split('.');
      const relativePath = join(p, '..', name);
      const source = this.options.publishFS.readFileSync(
        join('/input-bundles-cjs', relativePath + '.js')
      );
      const sourceModule = new Module(name, module.parent!) as any;
      sourceModule.paths = (Module as any)._nodeModulePaths(__dirname);
      sourceModule._compile(source.toString(), name);
      const exports = Object.keys(sourceModule.exports);
      if (exports.length === 0) {
        throw new Error('No exports found for ' + name);
      }
      const moduleExport = sourceModule['default']
        ? 'default'
        : Object.keys(sourceModule.exports.react_render)[0];
      this.pageElements[relativePath] =
        sourceModule.exports.react_render[moduleExport];
    });
  }

  private async bundle(
    root: string,
    path: string,
    outdir: string,
    cjs = false
  ) {
    return new Promise((resolve, reject) => {
      const compiler = webpack({
        entry: {
          [basename(path).split('.')[0]]: join(root, path),
        },
        mode: this.options.mode,
        output: {
          path: join(outdir, path, '..'),
          library: 'react_render',
          libraryTarget: cjs ? 'commonjs2' : 'var',
        },
        resolve: {
          extensions: ['.tsx', '.jsx', '.js', '.ts'],
        },
        externals: {
          react: cjs ? 'react' : 'React',
          'react-dom': cjs ? 'react-dom' : 'ReactDOM',
        },
        module: {
          rules: [
            {
              test: /\.tsx?$/,
              loader: 'ts-loader',
              options: {
                allowTsInNodeModules: true,
                transpileOnly: true,
              },
            },
            {
              test: /\.jsx?$/,
              exclude: /(node_modules|bower_components)/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: [
                    '@babel/preset-react',
                    [
                      '@babel/preset-env',
                      {
                        corejs: 3,
                        useBuiltIns: 'entry',
                        // caller.target will be the same as the target option from webpack
                        targets: cjs ? { node: 'current' } : 'defaults',
                      },
                    ],
                  ],
                },
              },
            },
          ],
        },
        optimization: {
          removeEmptyChunks: true,
          usedExports: true,
        },
      });
      compiler.outputFileSystem = this.options.publishFS as any;
      compiler.run((err, stats) => {
        if (this.options.debug) console.debug({ err, stats });
        if (err) reject(err);
        if (stats && stats.hasErrors()) reject(stats);
        resolve();
      });
    });
  }
}

export interface PageBuilderOptions {
  /**
   * Glob pattern to match files
   */
  glob: string[] | string;
  root: string;
  publishFS: typeof fs;
  pathDict: { [name: string]: string };
  debug: boolean;
  mode: 'development' | 'production';
}
