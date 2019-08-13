import globby from 'globby';
import * as React from 'react';
import { ComponentClass } from 'react';
import { renderToString, version as reactDomVersion } from 'react-dom/server';
import { PageBuilder } from './builder';
const serialize = require('serialize-javascript');
const suffix = process.env.NODE_ENV === 'production' ? '.production.min.js' : '.development.js';
const MFS = require('memory-fs');

export class Renderer {
  // File system storing built pages
  private readonly fs: any;

  // Temporary directory components only
  private pageDict: { [name: string]: ComponentClass } = {};
  private pathDict: { [name: string]: string } = {};
  private paths: string[] = [];

  constructor(private readonly directory: string) {
    this.fs = new MFS();
    const builder = new PageBuilder({
      pathDict: this.pathDict,
      publishFS: this.fs,
    });

    console.log('Building pages...');
    this.init()
      .then(() => builder.buildPages())
      .then(() => console.log('Finished building pages.'));
  }

  getHtml(name: string, props: object) {
    const js = this.getClient(name);
    return `
  <!DOCTYPE html>
  <html>
  <head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="" rel="icon" type="image/x-icon" />
  <title>React Example</title>
  <link rel="stylesheet" href="//fonts.googleapis.com/css?family=Roboto:300,300italic,700,700italic">
  <link rel="stylesheet" href="//cdn.rawgit.com/necolas/normalize.css/master/normalize.css">
  <link rel="stylesheet" href="//cdn.rawgit.com/milligram/milligram/master/dist/milligram.min.css">
  <link rel="stylesheet" href="/public/base.css">
  </head>
  <body>
  ${renderToString(<div id="react-container">{React.createFactory(this.pageDict[name])(props)}</div>)}
  </div>
  <script src="https://unpkg.com/react@${React.version}/umd/react${suffix}"></script>
  <script src="https://unpkg.com/react-dom@${reactDomVersion}/umd/react-dom${suffix}"></script>
  <script>var APP_PROPS = ${serialize(props)};</script>
  <script>${js}</script>
  </body>
  </html>
  `;
  }

  async init() {
    // Find all component files
    const files = await globby('*', { cwd: this.directory });
    this.paths = files.map(f => `${this.directory}/${f}`);

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
