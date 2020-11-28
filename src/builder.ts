const TerserPlugin = require('terser-webpack-plugin');
import Module from 'module';
import globby from 'globby';
import { basename } from 'path';
import * as fs from 'fs';
import webpack from 'webpack';

export class PageBuilder {
  private pageElements: Record<string, any> = {};
  constructor(private readonly options: PageBuilderOptions) {}

  async bundleSource() {
    // Find all component files
    const files = await globby(this.options.glob, {
      expandDirectories: true,
    });

    // Bundle source input
    const bundling = async (path: string) => {
      await this.bundle(path, '/input-bundles');
      await this.bundle(path, '/input-bundles-cjs', true);
    };
    await Promise.all(files.map((p) => bundling(p)));
    this.cacheSourceModules(files);
  }

  getPageNode(name: string) {
    return this.pageElements[name];
  }

  getPageBrowser(name: string) {
    return this.options.publishFS.readFileSync(`/input-bundles/${name}.js`);
  }

  private cacheSourceModules(paths: string[]) {
    paths.forEach((p) => {
      const [name] = basename(p).split('.');
      const source = this.options.publishFS.readFileSync(
        `/input-bundles-cjs/${name}.js`
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
      this.pageElements[name] = sourceModule.exports.react_render[moduleExport];
    });
  }

  private async bundle(path: string, outdir: string, cjs = false) {
    return new Promise((resolve, reject) => {
      const compiler = webpack({
        entry: {
          [basename(path).split('.')[0]]: path,
        },
        mode: this.options.mode,
        output: {
          path: outdir,
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
  publishFS: typeof fs;
  pathDict: { [name: string]: string };
  debug: boolean;
  mode: 'development' | 'production';
}
