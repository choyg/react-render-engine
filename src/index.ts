import { Express } from 'express';
import { Renderer } from './renderer';
import { ReactSSROptions } from './types';

export const ReactSSR = (app: Express, options?: Partial<ReactSSROptions>) => {
  const renderer = new Renderer(options);
  app.use((req, res, next) => {
    res.render = (path: string, props?: object) => {
      const rendered = renderer.getHtml(path, props || {});
      res.set('Content-Type', 'text/html');
      res.send(rendered);
    };
    next();
  });
};
