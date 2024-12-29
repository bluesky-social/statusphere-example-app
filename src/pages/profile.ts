import { html } from '../lib/view'
import { shell } from './shell'

type Props = { 
  error?: string 
  displayName?: string
  handle?: string
  avatar?: string
  banner?: string
}

export function profile(props: Props) {
  return shell({
    title: 'Profile page',
    content: content(props),
  })
}

function content({ error, banner, avatar, displayName, handle }: Props) {
  return html`
    <div id="header">
      <img src="${banner}" class="img-fluid" alt="Kitten" />
    </div>
    <div class="container">
      <div>
        <img src="${avatar}" class="img-fluid rounded-circle img-thumbnail" alt="Kitten" />
        ${displayName ? html`<h1>${displayName}</h1>` : ''}
        ${handle ? html`<h2>${handle}</h2>` : ''}
      </div>
    </div>
  `
}
