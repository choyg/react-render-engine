import { Express } from 'express';
import { Props } from 'react';
import { Renderer } from './renderer';

export const ReactSSR = (app: Express, options: ReactSSROptions) => {
  const renderer = new Renderer(options.pages);
  app.use((req, res, next) => {
    res.render = (path: string, props?: object) => {
      const rendered = renderer.getHtml(path, props || {});
      res.set('Content-Type', 'text/html');
      res.send(rendered);
    };
    next();
  });
};

export interface ReactSSROptions {
  /**
   * Directory containing the page components
   */
  pages: string;

  /**
   * String inserted in between head tags
   *
   * <head>
   * ${ReactSSROptions.head}
   * </head>
   */
  head: string;

  /**
   * String inserted after the main React page
   *
   * <body>
   *   <div id="react-container" />
   *   ${ReactSSROptions.body}
   *   ${ReactSSROptions.reactSrc}
   *   ${ReactSSROptions.reactDomSrc}
   * </body>
   *
   */
  body: string;
}

export interface RenderOptions extends ReactSSROptions {
  props: Props<any>;
}
