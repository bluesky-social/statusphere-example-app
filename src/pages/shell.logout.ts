import { type Hole, html } from '../lib/view'

export function shell({ title, content }: { title: string; content: Hole }) {
  return html`<html data-bs-theme="dark">
    <head>
      <script src="/public/js/color-modes.js"></script>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      <link rel="stylesheet" href="/css/bootstrap.min.css" />
      <link rel="stylesheet" href="/icons/bootstrap-icons.min.css">
    </head>
    <body>
      ${content}
    </body>
  </html>`
}
