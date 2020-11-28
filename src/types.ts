import { Props } from 'react';

export interface RenderProps {
  options?: ReactSSROptions;
  props: object;
}

export interface ReactSSROptions {
  /**
   * Glob pattern of files to include as pages.
   *
   * @default ['**.js', '**.ts', '**.jsx', '**.tsx', '!node_modules']
   */
  glob: string | string[];

  /**
   * String inserted between head tags
   *
   * @default ''
   *
   * <head>
   * ${ReactSSROptions.head}
   * </head>
   */
  head: string;

  /**
   * String inserted after the main React page
   *
   * @default ''
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

  /**
   * Log debug messages for development
   *
   * @default false
   */
  debug: boolean;

  /**
   * Sets Webpack and React mode. Defaults to development unless NODE_ENV is production
   *
   */
  mode: 'production' | 'development';
}

export interface RenderOptions extends ReactSSROptions {
  props: Props<any>;
}

export const DefaultOptions: ReactSSROptions = {
  body: '',
  head: '',
  glob: ['**.js', '**.ts', '**.jsx', '**.tsx'],
  debug: false,
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
};
