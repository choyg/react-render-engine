import * as fs from 'fs';
import webpack from 'webpack';
import { rimraf } from './utils/rimraf';

export class PageBuilder {
  // Temporary directory components only
  private readonly rawDir = `${__dirname}/raw`;
  private readonly publishFS: any;
  private readonly buildFS = fs;
  private readonly pathDict: { [name: string]: string };

  constructor({ publishFS, pathDict }: PageBuilderOptions) {
    this.publishFS = publishFS;
    this.pathDict = pathDict;

    // Clear any existing generated folders
    rimraf(this.rawDir);

    // Create folder for tsx clients
    this.buildFS.mkdirSync(this.rawDir);
  }

  /**
   * Path to the folder containing all page components
   *
   * @param directory
   */
  async buildPages() {
    try {
      // Create the individual jsx clients
      const clients = await Promise.all(Object.entries(this.pathDict).map(([name, path]) => this.createClient(path)));

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
    const className = module[exportName].name;

    // Assume default export
    let componentName = 'componentClass';
    let importStatement = `import ${componentName} from '${path}';`;
    // If not default export, use the real export name
    if (exportName !== 'default') {
      componentName = exportName;
      importStatement = `import { ${componentName} } from '${path}';`;
    }

    path = path.substring(0, path.lastIndexOf('.'));
    const js = `
    import React from 'react';
    import { hydrate } from 'react-dom';
    ${importStatement}

    const w = window as any;
    const component = React.createFactory(${componentName});
    const el = document.getElementById('react-container');
    hydrate(component(w.APP_PROPS), el);
  `;
    const writePath = `${__dirname}/raw/${className}.tsx`;
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
        mode: 'production',
        output: {
          path: __dirname + '/clients',
        },
        resolve: {
          extensions: ['.tsx', '.jsx'],
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
      compiler.outputFileSystem = this.publishFS;
      compiler.run((err, stats) => {
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
}
