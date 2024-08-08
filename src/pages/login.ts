import { AtUri } from '@atproto/syntax'
import type { Post } from '#/db/schema'
import { html } from '../view'
import { shell } from './shell'

type Props = { error?: string }

export function login(props: Props) {
  return shell({
    title: 'Login',
    content: content(props),
  })
}

function content({ error }: Props) {
  return html`<div>
    <form action="/login" method="post">
      <input type="text" name="handle" placeholder="handle" required />
      <button type="submit">Log in.</button>
      ${error ? html`<p>Error: <i>${error}</i></p>` : undefined}
    </form>
  </div>`
}
