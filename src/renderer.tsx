import * as MFS from 'memfs';
import * as path from 'path';
import React from 'react';
import { renderToString, version as reactDomVersion } from 'react-dom/server';
import { PageBuilder } from './builder';
import { DefaultOptions, ReactSSROptions } from './types';
const serialize = require('serialize-javascript');

export class Renderer {
  private readonly options: ReactSSROptions;

  // React CDN suffix based on mode
  private readonly suffix: string;

  // File system storing built pages
  private readonly fs: any;

  private readonly builder: PageBuilder;

  // Dict of path to component name
  private pathDict: { [name: string]: string } = {};

  constructor(options?: Partial<ReactSSROptions>) {
    this.options = { ...DefaultOptions, ...options };

    this.suffix =
      this.options.mode === 'production'
        ? '.production.min.js'
        : '.development.js';

    this.fs = MFS.fs;
    this.fs.join = path.join;
    this.builder = new PageBuilder({
      sourceDirectory: this.options.pages,
      extensions: this.options.include,
      pathDict: this.pathDict,
      publishFS: this.fs,
      debug: this.options.debug,
      mode: this.options.mode,
    });
  }

  async init() {
    await this.builder.bundleSource();
  }

  getHtml(name: string, props: object) {
    //TODO require cache
    const reactPage = this.builder.getPageNode(name);
    const js = this.getClient(name);
    return `<!DOCTYPE html>
<html>
<head>
${this.options.head}
</head>
<body>
${renderToString(
  <div id="react-container">{React.createElement(reactPage)}</div>
)}
<script>var APP_PROPS = ${serialize(props)};</script>
<script src="https://unpkg.com/react@${React.version}/umd/react${
      this.suffix
    }"></script>
<script src="https://unpkg.com/react-dom@${reactDomVersion}/umd/react-dom${
      this.suffix
    }"></script>
${this.options.body}
<script>${js}</script>
</body>
</html>
`;
  }

  private getClient(name: string): string {
    return `
${this.builder.getPageBrowser(name)}
const keys = Object.keys(react_render);
if (!keys) throw new Error('No exports found');
const key = react_render.default ? 'default' : keys[0];
const component = React.createElement(react_render[key], window.APP_PROPS);
const el = document.getElementById('react-container');
ReactDOM.hydrate(component, el);
`;
  }
}
