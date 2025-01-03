import { html } from '../lib/view'
import { shell } from './shell'

type Props = { 
  error?: string 
  displayName?: string
  handle?: string
  avatar?: string
  banner?: string
  description?: string
  followersCount?: number
  followsCount?: number
  postsCount?: number
  createdAt?: string
  postsArray?: any[]
}

export function profile(props: Props) {
  return shell({
    title: 'Profile page',
    content: content(props),
  })
}

function content({ 
  error, 
  banner, 
  avatar, 
  displayName, 
  handle, 
  description, 
  followersCount, 
  followsCount, 
  postsCount, 
  createdAt,
  postsArray 
}: Props) {
  const date = ts(createdAt?? new Date().toISOString())
  return html`
    <div class="container px-0">
      <div class="row">
        <img src="${banner}" class="rounded-top px-0" alt="castle">
      </div>
      <div class="row">
        <div class="col-3" style="margin-top: -12%; position: relative;">
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
        <div class="col">
          ${displayName}
        </div>
        <div class="col">
          Member since: ${date}
        </div>
      </div>
      <div class="row">
        <div class="col">
          @${handle}
        </div>
      </div>
      <div class="row">
        <div class="col">
          ${followersCount} followers
        </div>
        <div class="col">
          ${followsCount} following
        </div>
        <div class="col">
          ${postsCount} posts
        </div>
      </div>
      <div class="row py-2">
        <div class="col">
          ${description}
        </div>
      </div>
    </div>
  
  ${postsArray?.map((post) => {
      return html`
      <div class="card mt-2">
        <div class="card-body">
          ${post}
          <a class="author" href="">Just testing</a>
          
        </div>
      </div>
    `
  })}
  `
}

function ts(createdAt: string) {
  const created = new Date(createdAt)
  return created.toDateString()
}
