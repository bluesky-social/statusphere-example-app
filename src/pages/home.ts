import { AtUri } from '@atproto/syntax'
import type { Status } from '#/db/schema'
import { html } from '../view'
import { shell } from './shell'

type Props = {
  statuses: Status[]
  profile?: { displayName?: string; handle: string }
}

export function home(props: Props) {
  return shell({
    title: 'Home',
    content: content(props),
  })
}

function content({ statuses, profile }: Props) {
  return html`<div id="root">
    <h1>Welcome to the Atmosphere</h1>
    ${profile
      ? html`<form action="/logout" method="post">
          <p>
            Hi, <b>${profile.displayName || profile.handle}</b>. It's pretty
            special here.
            <button type="submit">Log out.</button>
          </p>
        </form>`
      : html`<p>
          It's pretty special here.
          <a href="/login">Log in.</a>
        </p>`}
    <ul>
      ${statuses.map((status) => {
        return html`<li>
          ${status.status}
          <a href="${toBskyLink(status.authorDid)}" target="_blank"
            >${status.authorDid}</a
          >
        </li>`
      })}
    </ul>
  </div>`
}

function toBskyLink(did: string) {
  return `https://bsky.app/profile/${did}`
}
