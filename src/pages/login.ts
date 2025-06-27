import { env } from '#/env'
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
  const signupService =
    !env.PDS_URL || env.PDS_URL === 'https://bsky.social'
      ? 'Bluesky'
      : new URL(env.PDS_URL).hostname

  return html`<div id="root">
    <div id="header">
      <h1>Statusphere</h1>
      <p>Set your status on the Atmosphere.</p>
    </div>
    <div class="container">
      <form action="/login" method="post" class="login-form">
        <input
          type="text"
          name="input"
          placeholder="Enter your handle (eg alice.bsky.social)"
          required
        />

        <button type="submit">Log in</button>
      </form>

      <a href="/signup" class="button signup-cta">
        Login or Sign up with a ${signupService} account
      </a>

      ${error ? html`<p>Error: <i>${error}</i></p>` : undefined}
    </div>
  </div>`
}
