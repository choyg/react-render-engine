import {basename} from 'path';
import * as fs from 'fs';
import webpack from 'webpack';
import { rimraf } from './utils/rimraf';

export class PageBuilder {
  // Temporary directory components only
  private readonly rawDir = `${__dirname}/raw`;
  private readonly buildFS = fs;

  constructor(private readonly options: PageBuilderOptions) {
    // Clear any existing generated folders
    rimraf(this.rawDir);

    // Create folder for tsx clients
    this.buildFS.mkdirSync(this.rawDir);
  }

  /**
   * Path to the folder containing all page components
   */
  async buildPages() {
    try {
      // Create the individual jsx clients
      const clients = await Promise.all(Object.entries(this.options.pathDict).map(([name, path]) => this.createClient(path)));

      // Webpack bundle each client into js
      await Promise.all(
        clients.map((path, index) => {
          const name = path.substring(path.lastIndexOf('/') + 1, path.length - 4);
          return this.bundleClient(path, name.toString());
        })
      );

      rimraf(this.rawDir);
    } catch (err) {
      rimraf(this.rawDir);
      throw err;
    }
  }

  /**
   * Creates a tsx file for the page component
   *
   * @param path
   * @param name Name of the component to import
   */
  async createClient(path: string) {
    // Use file's first export. Special handling for default exports
    const module = require(path);
    const exportName = Object.keys(module)[0];
    let className = module[exportName].name;

    // Assume default export
    let componentName = 'componentClass';
    let importStatement = `import ${componentName} from '${path}';`;
    // If not default export, use the real export name
    if (exportName !== 'default' && className) {
      componentName = exportName;
      importStatement = `import { ${componentName} } from '${path}';`;
    } else if (exportName !== 'default' && !className) {
      // Function component
      componentName = exportName;
      className = exportName;
      importStatement = `import { ${componentName} } from '${path}';`;
    }

    const js = `
    import React from 'react';
    import { hydrate } from 'react-dom';
    ${importStatement}

    const w = window as any;
    const component = React.createElement(${componentName}, w.APP_PROPS);
    const el = document.getElementById('react-container');
    hydrate(component, el);
  `;
    const writePath = `${__dirname}/raw/${basename(path)}`;
    this.buildFS.writeFileSync(writePath, js);
    return writePath;
  }

  /**
   * Bundles a client for the specific page component from client tsx
   *
   * @param path Path to the client file
   * @param name Component name
   */
  async bundleClient(path: string, name: string) {
    return new Promise((resolve, reject) => {
      const compiler = webpack({
        entry: {
          [name]: path,
        },
        mode: this.options.mode,
        output: {
          filename: basename(path),
          path: __dirname + '/clients',
        },
        resolve: {
          extensions: ['.tsx', '.jsx', '.js', '.ts'],
        },
        externals: {
          react: 'React',
          'react-dom': 'ReactDOM',
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
          ],
        },
      });
      compiler.outputFileSystem = this.options.publishFS;
      compiler.run((err, stats) => {
        if (this.options.debug) console.debug({ err, stats });
        if (err) reject(err);
        if (stats.hasErrors()) reject(stats);
        resolve();
      });
    });
  }
}

export interface PageBuilderOptions {
  publishFS: any;
  pathDict: { [name: string]: string };
  debug: boolean;
  mode: 'development' | 'production';
}
