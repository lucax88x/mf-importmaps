/// <reference types="vite/client" />

import 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'mf-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        label?: string
      }
    }
  }
}
