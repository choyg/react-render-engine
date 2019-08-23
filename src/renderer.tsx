import globby from 'globby';
import * as path from 'path';
import * as React from 'react';
import { ComponentClass } from 'react';
import { renderToString, version as reactDomVersion } from 'react-dom/server';
import { PageBuilder } from './builder';
import { ReactSSROptions } from './types';
const serialize = require('serialize-javascript');
const suffix = process.env.NODE_ENV === 'production' ? '.production.min.js' : '.development.js';
const MFS = require('memory-fs');

export class Renderer {
  private readonly options: ReactSSROptions;

  // File system storing built pages
  private readonly fs: any;

  // Temporary directory components only
  private pageDict: { [name: string]: ComponentClass } = {};
  // Dict of path to component name
  private pathDict: { [name: string]: string } = {};
  private paths: string[] = [];

  constructor(options: ReactSSROptions) {
    this.options = options;

    this.fs = new MFS();
    const builder = new PageBuilder({
      pathDict: this.pathDict,
      publishFS: this.fs,
    });

    console.info('Building React pages...');
    this.init()
      .then(() => builder.buildPages())
      .then(() => console.info('Finished building React pages.'));
  }

  getHtml(name: string, props: object) {
    const js = this.getClient(name);
    return `
  <!DOCTYPE html>
  <html>
  ${this.options.head}
  </head>
  <body>
  ${renderToString(<div id="react-container">{React.createFactory(this.pageDict[name])(props)}</div>)}
  </div>
  <script>var APP_PROPS = ${serialize(props)};</script>
  <script src="https://unpkg.com/react@${React.version}/umd/react${suffix}"></script>
  <script src="https://unpkg.com/react-dom@${reactDomVersion}/umd/react-dom${suffix}"></script>
  ${this.options.body}
  <script>${js}</script>
  </body>
  </html>
  `;
  }

  async init() {
    let directory = this.options.pages;
    if (!path.isAbsolute(directory)) {
      directory = `${process.cwd()}/${directory}`;
    }

    // Find all component files
    const files = await globby('*', { cwd: directory });
    this.paths = files.map(f => `${directory}/${f}`);

    // Create map of component name -> module and page
    this.paths.map(path => {
      const module = require(path);
      const name = module[Object.keys(module)[0]].name;
      this.pageDict[name] = module[Object.keys(module)[0]];
      this.pathDict[name] = path;
    });
  }

  getClient(name: string): string {
    return this.fs.readFileSync(`${__dirname}/clients/${name}.js`, 'utf8');
  }
}
