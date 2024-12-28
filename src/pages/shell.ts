import { type Hole, html } from '../lib/view'

export function shell({ title, content }: { title: string; content: Hole }) {
  return html`<html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      <link rel="stylesheet" href="/public/bootstrap.min.css" />
      <link rel="stylesheet" href="/public/bootstrap-icons.min.css">
    </head>
    <body>
      ${content}
    </body>
  </html>`
}
