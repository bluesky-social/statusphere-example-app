import { type Hole, html } from '../lib/view'
//import "bootswatch/dist/united/bootstrap.min.css"

export function shell({ title, content }: { title: string; content: Hole }) {
  return html`<html>
    <head>
      <title>${title}</title>
      <link rel="stylesheet" href="/public/bootstrap.min.css" />
    </head>
    <body>
      ${content}
    </body>
  </html>`
}
