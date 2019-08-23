import { Props } from 'react';

export interface RenderProps {
  options?: ReactSSROptions;
  props: object;
}

export interface ReactSSROptions {
  /**
   * Directory containing the page components
   */
  pages: string;

  /**
   * String inserted between head tags
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
