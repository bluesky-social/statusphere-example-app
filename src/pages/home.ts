import type { Status } from '#/db'
import { html } from '../lib/view'
import { shell } from './shell'

const TODAY = new Date().toDateString()

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
  profile?: { displayName?: string }
  myStatus?: Status
}

export function home(props: Props) {
  return shell({
    title: 'Home',
    content: content(props),
  })
}

function content({ statuses, didHandleMap, profile, myStatus }: Props) {
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
                Hi, <strong>${profile.displayName || 'friend'}</strong>. What's
                your status today?
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
      <form action="/status" method="post" class="status-options">
        ${STATUS_OPTIONS.map(
          (status) =>
            html`<button
              class=${myStatus?.status === status
                ? 'status-option selected'
                : 'status-option'}
              name="status"
              value="${status}"
            >
              ${status}
            </button>`
        )}
      </form>
      ${statuses.map((status, i) => {
        const handle = didHandleMap[status.authorDid] || status.authorDid
        const date = ts(status)
        return html`
          <div class=${i === 0 ? 'status-line no-line' : 'status-line'}>
            <div>
              <div class="status">${status.status}</div>
            </div>
            <div class="desc">
              <a class="author" href=${toBskyLink(handle)}>@${handle}</a>
              ${date === TODAY
                ? `is feeling ${status.status} today`
                : `was feeling ${status.status} on ${date}`}
            </div>
          </div>
        `
      })}
    </div>
  </div>`
}

function toBskyLink(did: string) {
  return `https://bsky.app/profile/${did}`
}

function ts(status: Status) {
  const createdAt = new Date(status.createdAt)
  const indexedAt = new Date(status.indexedAt)
  if (createdAt < indexedAt) return createdAt.toDateString()
  return indexedAt.toDateString()
}
