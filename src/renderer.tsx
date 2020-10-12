import {basename} from 'path';
import globby from 'globby';
import * as path from 'path';
import React from 'react';
import { ComponentClass } from 'react';
import { renderToString, version as reactDomVersion } from 'react-dom/server';
import { PageBuilder } from './builder';
import { DefaultOptions, ReactSSROptions } from './types';
const serialize = require('serialize-javascript');
const MFS = require('memory-fs');

export class Renderer {
  private readonly options: ReactSSROptions;

  // React CDN suffix based on mode
  private readonly suffix: string;

  // File system storing built pages
  private readonly fs: any;

  // Temporary directory components only
  private pageDict: { [name: string]: ComponentClass } = {};
  // Dict of path to component name
  private pathDict: { [name: string]: string } = {};
  private paths: string[] = [];

  constructor(options?: Partial<ReactSSROptions>) {
    this.options = { ...DefaultOptions, ...options };

    this.suffix = this.options.mode === 'production' ? '.production.min.js' : '.development.js';

    this.fs = new MFS();
    const builder = new PageBuilder({
      pathDict: this.pathDict,
      publishFS: this.fs,
      debug: this.options.debug,
      mode: this.options.mode,
    });

    console.info('Building React pages...');
    this.init()
      .then(() => builder.buildPages())
      .then(() => console.info('Finished building React pages.'))
      .catch(err => {
        if (this.options.debug) console.error(err);
        throw err;
      });
  }

  getHtml(name: string, props: object) {
    const js = this.getClient(name);
    return `
<!DOCTYPE html>
<html>
<head>
${this.options.head}
</head>
<body>
${renderToString(<div id="react-container">{React.createElement(this.pageDict[name], props)}</div>)}
<script>var APP_PROPS = ${serialize(props)};</script>
<script src="https://unpkg.com/react@${React.version}/umd/react${this.suffix}"></script>
<script src="https://unpkg.com/react-dom@${reactDomVersion}/umd/react-dom${this.suffix}"></script>
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
    const files = await globby(this.options.include, { cwd: directory, expandDirectories: true });
    this.paths = files.map(f => `${directory}/${f}`);

    // Create map of component name -> module and page
    this.paths.map(path => {
      const module = require(path);
      const name = basename(path);
      this.pageDict[name] = module[Object.keys(module)[0]];
      this.pathDict[name] = path;
    });
  }

  getClient(name: string): string {
    const t = this.fs.readFileSync(`${__dirname}/clients/${name}`, 'utf8');
    return t;
  }
}
