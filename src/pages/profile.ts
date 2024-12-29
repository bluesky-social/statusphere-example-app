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
    <div class="container">
      <div class="row">
        <img src="${banner}" class="card-img-top" alt="castle">
      </div>
      <div class="row">
        <div class="col-3" style="margin-top: -10%; position: relative;">
          <img src="${avatar}" class="img-fluid rounded-circle img-thumbnail" alt="Kitten" />
        </div>
        <div class="col">
          Edit profile
        </div>
        <div class="col">
          ...
        </div>
      </div>
      <div class="row">
        ${displayName}
      </div>
      <div class="row">
        @${handle}
      </div>
      <div class="row">
        <div class="col">
          Followers...
        </div>
        <div class="col">
          Following...
        </div>
        <div class="col">
          Posts...
        </div>
      </div>
      <div class="row">
        ${description}
      </div>
    </div>
  `
}
