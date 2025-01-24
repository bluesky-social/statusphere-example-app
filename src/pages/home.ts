import type { AppBskyEmbedExternal } from "@atproto/api";
import type { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import { html } from "../lib/view";
import { shell } from "./shell";
import { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo("en-US");

type Props = {
	error?: string;	
  profile?: ProfileViewDetailed;
	postsArray?: FeedViewPost[];
	feedName?: string;
};

export function home(props: Props) {
	return shell({
		title: "Home page",
		content: content(props),
	});
}

function content({
	error,	
  profile,
	postsArray,
	feedName,
}: Props) {
	const date = ts(profile?.createdAt ?? new Date().toISOString());
	return html`
    ${
			profile?.banner
				? html`<div class="container px-0">
      <div class="row">
        <img src="${profile.banner}" class="rounded-top px-0" alt="castle">
      </div>
      <div class="row">
        <div class="col-3" style="margin-top: -12%; position: relative;">
          <img src="${profile.avatar}" class="img-fluid rounded-circle img-thumbnail" alt="${profile.displayName}" />
        </div>
        <div class="col-4">          
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
          ${profile.displayName}
        </div>
        <div class="col">
          Joined: ${date}
        </div>
      </div>
      <div class="row">
        <div class="col">
          @${profile.handle}
        </div>
      </div>
      <div class="row">
        <div class="col">
          <a href= "/">${profile.followersCount} followers</a>
        </div>
        <div class="col">
          <a href= "/">${profile.followsCount} following</a>
        </div>
        <div class="col text-primary">
          ${profile.postsCount} posts
        </div>
      </div>
      <div class="row py-2">
        <div class="col">
          ${profile.description}
        </div>
      </div>
    </div>`
				: html`<div id="header" class="text-center border-bottom border-primary">      
      <p class= "fs-2"><i class="bi bi-caret-left-fill text-primary" onclick="history.back()"></i>${feedName}</p>    
    </div>`
		}    
  
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
          
          ${
						post.post.embed?.$type === "app.bsky.embed.images#view"
							? html`${(
									post.post.embed as { images: { fullsize: string }[] }
								).images.map(
									(img) => html`
          <img src="${img.fullsize}" class="rounded img-fluid w-100 mx-0" alt="...">`,
								)}`
							: ""
					}          

          ${
						post.post.embed?.$type === "app.bsky.embed.external#view"
							? html`          
          <div class="card">
            <img src="${(post.post.embed.external as AppBskyEmbedExternal.ViewExternal).thumb}" class="img-fluid rounded-top" alt="a link to an external site">
            <div class="card-body overflow-hidden">
              <h5 class="card-title">${(post.post.embed.external as AppBskyEmbedExternal.ViewExternal).title}</h5>
              <p class="card-text">${(post.post.embed.external as AppBskyEmbedExternal.ViewExternal).description}</p>
              <a href="${(post.post.embed.external as AppBskyEmbedExternal.ViewExternal).uri}" class="btn"><i class="bi bi-globe"></i> ${(post.post.embed.external as AppBskyEmbedExternal.ViewExternal).uri}</a>
            </div>
          </div>`
							: ""
					}

          ${
						post.post.embed?.$type === "app.bsky.embed.video#view"
							? html`
          <div class="card border-0">
            <video
              id="my-player"
              class="video-js rounded justify-content-start w-100"
              style= "background-color: inherit;"
              controls
              preload="auto"
              poster="${post.post.embed.thumbnail}"
              data-setup='{}'>
              <source src="${post.post.embed.playlist}" type="application/x-mpegURL"></source>              
            </video>
          </div>`
							: ""
					}
        </div>
        <div class="card-footer d-flex justify-content-between">
          <a href="/" class= "btn text-primary"><i class="bi bi-chat-left"></i> ${post.post.replyCount}</a> 
          <a href="/" class= "btn text-primary"><i class="bi bi-arrow-left-right"></i> ${(post.post.repostCount ?? 0) + (post.post.quoteCount ?? 0)}</a> 
          <a href="/" class= "btn text-primary"><i class="bi bi-heart"></i> ${post.post.likeCount}</i></a> 
          <a href="/" class= "btn text-primary"><i class="bi bi-three-dots"></i></a>
        </div>
      </div>
    `;
	})}
  `;
}

function ts(createdAt: string) {
	const created = new Date(createdAt);
	return created.toDateString();
}
