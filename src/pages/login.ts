import { html } from '../lib/view'
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
    <div id="header">
      <h1>Statusphere</h1>
      <p>Set your status on the Atmosphere.</p>
    </div>
    <div class="container">
      <form action="/login" method="post" class="login-form" id="login-form">
        <div class="login-input">
          <input
            type="text"
            name="handle"
            placeholder="Enter your handle (eg alice.bsky.social)" />
          <button type="submit">Log in</button>
        </div>
        ${error ? html`<p>Error: <i>${error}</i></p>` : undefined}
      </form>
      <div class="signup-cta">
        Don't have an account on the Atmosphere?
        <input
          form="login-form"
          type="submit"
          name="signup"
          value="Sign up via Bluesky" />
        to create one now!
      </div>
    </div>
  </div>`
}
