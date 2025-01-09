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
      <p class= "fs-2"><i class="bi bi-caret-left-fill text-primary"></i>Feeds</p>    
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
                    ${getLastPart(item.value)}
                    <div>
                    ${item.value}
                    </div>
                    ${item.type}
                    ${item.pinned ? html`<i class="bi bi-pin-angle-fill"></i>` : ''}
                    ${item.id} 
                  </div>
                  </div>
                `;
        })}
      </div>
    </div>
  `;
}
