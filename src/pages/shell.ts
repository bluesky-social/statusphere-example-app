import { type Hole, html } from '../view'

export function shell({ title, content }: { title: string; content: Hole }) {
  return html`<html>
    <head>
      <title>${title}</title>
      <link rel="stylesheet" href="/public/styles.css">
    </head>
    <body>
      ${content}
    </body>
  </html>`
}
