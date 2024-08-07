import { AtUri } from '@atproto/syntax'
import type { Post } from '#/db/schema'
import { html } from '../view'
import { shell } from './shell'

export function home(posts: Post[]) {
  return shell({
    title: 'Home',
    content: content(posts),
  })
}

function content(posts: Post[]) {
  return html`<div>
    <h1>Welcome to My Page</h1>
    <p>It's pretty special here.</p>
    <ul>
      ${posts.map((post) => {
        return html`<li>
          <a href="${toBskyLink(post.uri)}" target="_blank">🔗</a>
          ${post.text}
        </li>`
      })}
    </ul>
    <a href="/">Give me more</a>
  </div>`
}

function toBskyLink(uriStr: string) {
  const uri = new AtUri(uriStr)
  return `https://bsky.app/profile/${uri.host}/post/${uri.rkey}`
}
