const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
import Module from 'module';
import globby from 'globby';
import { isAbsolute, join } from 'path';
import { basename } from 'path';
import * as fs from 'fs';
import webpack from 'webpack';

export class PageBuilder {
  private pageElements: Record<string, any> = {};
  constructor(private readonly options: PageBuilderOptions) {}

  async bundleSource() {
    let directory = this.options.sourceDirectory;
    if (!isAbsolute(directory)) {
      directory = join(process.cwd(), directory);
    }

    // Find all component files
    const files = await globby(this.options.extensions, {
      cwd: directory,
      expandDirectories: true,
    });
    const paths = files.map((f) => join(directory, f));

    // Bundle source input
    const bundling = async (path: string) => {
      await this.bundle(path, '/input-bundles');
      await this.bundle(path, '/input-bundles-cjs', true);
    };
    await Promise.all(paths.map((p) => bundling(p)));
    this.cacheSourceModules(paths);
  }

  getPageNode(name: string) {
    return this.pageElements[name];
  }

  getPageBrowser(name: string) {
    return this.options.publishFS.readFileSync(`/input-bundles/${name}`);
  }

  private cacheSourceModules(paths: string[]) {
    paths.forEach((p) => {
      const name = basename(p);
      const source = this.options.publishFS.readFileSync(
        `/input-bundles-cjs/${name}`
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
        : Object.keys(sourceModule.exports)[0];
      this.pageElements[name] = sourceModule.exports[moduleExport];
    });
  }

  private async bundle(path: string, outdir: string, cjs = false) {
    return new Promise((resolve, reject) => {
      const compiler = webpack({
        entry: {
          [basename(path)]: path,
        },
        mode: this.options.mode,
        output: {
          filename: basename(path),
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
                  presets: ['@babel/preset-react'],
                },
              },
            },
          ],
        },
      });
      compiler.outputFileSystem = this.options.publishFS as any;
      compiler.run((err, stats) => {
        if (this.options.debug) console.debug({ err, stats });
        if (err) reject(err);
        // if (stats && stats.hasErrors()) reject(stats);
        resolve();
      });
    });
  }
}

export interface PageBuilderOptions {
  sourceDirectory: string;
  extensions: string[] | string;
  publishFS: typeof fs;
  pathDict: { [name: string]: string };
  debug: boolean;
  mode: 'development' | 'production';
}
