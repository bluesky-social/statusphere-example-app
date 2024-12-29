import { html } from '../lib/view'
import { shell } from './shell'

type Props = { 
  error?: string 
  displayName?: string
  handle?: string
  avatar?: string
  banner?: string
  description?: string
}

export function profile(props: Props) {
  return shell({
    title: 'Profile page',
    content: content(props),
  })
}

function content({ error, banner, avatar, displayName, handle, description }: Props) {
  return html`
    <div class="container p-0">
      <div class="card">
        <img src="${banner}" class="card-img-top" alt="castle">
        <div class="card-body">
          <img src="${avatar}" class="img-fluid rounded-circle img-thumbnail" alt="Kitten" />
          <h5 class="card-title">${displayName}</h5>
          <p>@${handle}</p>
          <p class="card-text">${description}</p>
          <a href="#" class="btn">Go somewhere</a>
        </div>
      </div>
    </div>
  `
}
