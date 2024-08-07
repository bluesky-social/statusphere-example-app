import { type Hole, html } from '../view'

export function shell({ title, content }: { title: string; content: Hole }) {
  return html`<html>
    <head>
      <title>${title}</title>
    </head>
    <body>
      ${content}
    </body>
  </html>`
}
