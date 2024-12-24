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
  profile: { displayName?: string }
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
    <div id="header" class="text-center">
      <h1>Statusphere</h1>
      <p>Set your status on the Atmosphere.</p>
    </div>
    <div class="container">
      <div class="card">
        <p class="m-2">
          Hi, <strong>${profile.displayName}</strong>. What's your status today?
        </p>
        <form action="/logout" method="post" class="session-form">
          <div class="m-2">
            
            <button type="submit" class="btn btn-primary">Log out</button>
          </div>
        </form>
      </div>
      <form action="/status" method="post" class="status-options">
        ${STATUS_OPTIONS.map(
          (status) =>
            html`<button class="m-2 rounded-circle border border-primary btn btn-lg" style="--bs-border-opacity: .5;"
              
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
          <div>
            <div class="p-1">
              ${status.status}
              <a class="author" href=${toBskyLink(handle)}>${handle}</a>
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
