import { AtUri } from '@atproto/syntax'
import type { Post } from '#/db/schema'
import { html } from '../view'
import { shell } from './shell'

type Props = { posts: Post[]; profile?: { displayName?: string; handle: string } }

export function home(props: Props) {
  return shell({
    title: 'Home',
    content: content(props),
  })
}

function content({ posts, profile }: Props) {
  return html`<div id="root">
    <h1>Welcome to the Atmosphere</h1>
    ${
      profile
        ? html`<form action="/logout" method="post">
          <p>
            Hi, <b>${profile.displayName || profile.handle}</b>. It's pretty special here.
            <button type="submit">Log out.</button>
          </p>
        </form>`
        : html`<p>
          It's pretty special here.
          <a href="/login">Log in.</a>
        </p>`
    }
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
