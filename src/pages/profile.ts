import { FeedViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import { html } from '../lib/view'
import { shell } from './shell'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import type AppBskyFeedPost from '@atproto/api'
import type AppBskyEmbedImages from '@atproto/api'

TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo('en-US')

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
  postsArray?: []
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
          <a href="/" class= "btn text-primary">Edit profile</a>
        </div>
        <div class="col">
          <a href="/" class= "btn text-primary"><i class="bi bi-three-dots"></i></a>
        </div>
      </div>
      <div class="row">
        <div class="col">
          ${displayName}
        </div>
        <div class="col">
          Joined: ${date}
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
   // console.log(post)
      return html`
      <div class="card mt-2">
        <div class="card-body">
          <div class="container">
            <div class="row align-items-start">
              <div class="col">
                <img src="${post.post.author.avatar}" class="img-fluid rounded-circle img-thumbnail" alt="Kitten" />
              </div>
              <div class="col-7">
                <h5 class="card-title">${post.post.author.displayName}</h5>
                <h6 class="card-subtitle mb-2 text-body-secondary">@${post.post.author.handle}</h6>
              </div>
              <div class="col-3">
                &#183; ${timeAgo.format(new Date(post.post.indexedAt))}
              </div>
            </div>
          </div>
          <p class= "card-text"> ${(post.post.record as { text: string }).text} </p>
          
          ${post.post.embed?.images ? html`${post.post.embed.images.map(img => html`
          <img src="${img.fullsize}" class="rounded img-fluid w-100 mx-0" alt="...">`)}` : ''}

          ${post.post.embed?.external ? html`
          <div class="card">
            <img src="${post.post.embed.external.thumb}" class="img-fluid rounded-top" alt="a link to an external site">
            <div class="card-body">
              <h5 class="card-title">${post.post.embed.external.title}</h5>
              <p class="card-text">${post.post.embed.external.description}</p>
              <a href="${post.post.embed.external.uri}" class="btn"><i class="bi bi-globe"></i> ${post.post.embed.external.uri}</a>
            </div>
          </div>` : ''}

        </div>
        <div class="card-footer d-flex justify-content-between">
          <a href="/" class= "btn text-primary"><i class="bi bi-chat-left"></i> ${post.post.replyCount}</a> 
          <a href="/" class= "btn text-primary"><i class="bi bi-arrow-left-right"></i> ${post.post.repostCount + post.post.quoteCount} reposts & Quotes</a> 
          <a href="/" class= "btn text-primary"><i class="bi bi-heart"></i> ${post.post.likeCount}</i></a> 
          <a href="/" class= "btn text-primary"><i class="bi bi-three-dots"></i></a>
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
