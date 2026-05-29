import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        'ios-src'?: string;
        ar?: boolean | string;
        'ar-modes'?: string;
        'camera-controls'?: boolean | string;
        'shadow-intensity'?: string;
        'shadow-softness'?: string;
        'auto-rotate'?: boolean | string;
        'ar-placement'?: string;
        scale?: string;
        exposure?: string;
        'interaction-prompt'?: string;
        alt?: string;
      };
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        'ios-src'?: string;
        ar?: boolean | string;
        'ar-modes'?: string;
        'camera-controls'?: boolean | string;
        'shadow-intensity'?: string;
        'shadow-softness'?: string;
        'auto-rotate'?: boolean | string;
        'ar-placement'?: string;
        scale?: string;
        exposure?: string;
        'interaction-prompt'?: string;
        alt?: string;
      };
    }
  }
}
