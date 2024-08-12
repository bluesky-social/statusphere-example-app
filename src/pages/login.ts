import { html } from '../view'
import { shell } from './shell'

type Props = { error?: string }

export function login(props: Props) {
  return shell({
    title: 'Log in',
    content: content(props),
  })
}

function content({ error }: Props) {
  return html`<div id="root">
    <form action="/login" method="post">
      <input type="text" name="handle" placeholder="handle" required />
      <button type="submit">Log in.</button>
      ${error ? html`<p>Error: <i>${error}</i></p>` : undefined}
    </form>
  </div>`
}
