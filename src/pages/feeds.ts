import { AppBskyActorDefs } from "@atproto/api";
import { html } from "../lib/view";
import { shell } from "./shell";
import type { SavedFeed } from '@atproto/api/dist/client/types/app/bsky/actor/defs';

type Props = { 
  error?: string;
  items: SavedFeed[];
};

export function feeds(props: Props) {
	return shell({
		title: "Feeds page",
		content: content(props),
	});
}

function content({ error, items }: Props) {
	return html`
    <div id="header" class="text-center border-bottom border-primary">      
      <p class= "fs-2"><i class="bi bi-caret-left-fill text-primary" onclick="history.back()"></i>Feeds</p>    
    </div>
    <div class="container">
      <div>        
        ${items.map((item, i) => {
                const getLastPart = (value: string) => value.substring(value.lastIndexOf('/') + 1);
                return html`
                  <div class="card mt-2">
                  <div class="card-body">
                    <button class="btn btn-primary">
                      <i class="bi bi-list-stars"></i>
                    </button>
                    <form action="/feeds" method="post" class="">
                      <input type="hidden" name="value" value="${item.value}">
                      <input type="hidden" name="type" value="${item.type}">
                      <input type="hidden" name="pinned" value="${item.pinned}">
                      <input type="hidden" name="id" value="${item.id}">
                      ${item.type === 'feed' ? html`<button class="btn" type="submit">
                        ${getLastPart(item.value)}
                      </button>` : getLastPart(item.value)}
                      
                    </form>    
                    ${item.pinned ? html`<i class="bi bi-pin-angle-fill"></i>` : ''}
                     
                  </div>
                  </div>
                `;
        })}
      </div>
    </div>
  `;
}
