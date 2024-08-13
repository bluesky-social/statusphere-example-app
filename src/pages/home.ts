import { AtUri } from '@atproto/syntax'
import type { Status } from '#/db/schema'
import { html } from '../view'
import { shell } from './shell'

const STATUS_OPTIONS = [
  '👍',
  '👎',
  '💙',
  '🥹',
  '😧',
  '😤',
  '🙃',
  '😉',
  '😎',
  '🤓',
  '🤨',
  '🥳',
  '😭',
  '😤',
  '🤯',
  '🫡',
  '💀',
  '✊',
  '🤘',
  '👀',
  '🧠',
  '👩‍💻',
  '🧑‍💻',
  '🥷',
  '🧌',
  '🦋',
  '🚀',
]

type Props = {
  statuses: Status[]
  didHandleMap: Record<string, string>
  profile?: { displayName?: string; handle: string }
}

export function home(props: Props) {
  return shell({
    title: 'Home',
    content: content(props),
  })
}

function content({ statuses, didHandleMap, profile }: Props) {
  return html`<div id="root">
    <div class="error"></div>
    <div id="header">
      <h1>Statusphere</h1>
      <p>Set your status on the Atmosphere.</p>
    </div>
    <div class="container">
      <div class="card">
        ${profile
          ? html`<form action="/logout" method="post" class="session-form">
              <div>
                Hi, <strong>${profile.displayName || profile.handle}</strong>.
                what's your status today?
              </div>
              <div>
                <button type="submit">Log out</button>
              </div>
            </form>`
          : html`<div class="session-form">
              <div><a href="/login">Log in</a> to set your status!</div>
              <div>
                <a href="/login" class="button">Log in</a>
              </div>
            </div>`}
      </div>
      <div class="status-options">
        ${STATUS_OPTIONS.map(
          (status) =>
            html`<div
              class="status-option"
              data-value="${status}"
              data-authed=${profile ? '1' : '0'}
            >
              ${status}
            </div>`
        )}
      </div>
      ${statuses.map((status, i) => {
        const handle = didHandleMap[status.authorDid] || status.authorDid
        return html`
          <div class=${i === 0 ? 'status-line no-line' : 'status-line'}>
            <div>
              <div class="status">${status.status}</div>
            </div>
            <div class="desc">
              <a class="author" href=${toBskyLink(handle)}>@${handle}</a>
              is feeling ${status.status} on ${ts(status)}
            </div>
          </div>
        `
      })}
    </div>
    <script src="/public/home.js"></script>
  </div>`
}

function toBskyLink(did: string) {
  return `https://bsky.app/profile/${did}`
}

function ts(status: Status) {
  const indexedAt = new Date(status.indexedAt)
  const updatedAt = new Date(status.updatedAt)
  if (updatedAt > indexedAt) return updatedAt.toDateString()
  return indexedAt.toDateString()
}
