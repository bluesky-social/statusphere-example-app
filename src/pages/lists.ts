import type { ListView } from "@atproto/api/dist/client/types/app/bsky/graph/defs";
import { html } from "../lib/view";
import { shell } from "./shell";

type Props = {
	error?: string;
	items?: ListView[];
};

export function lists(props: Props) {
	return shell({
		title: "Lists page",
		content: content(props),
	});
}

function content({ error, items }: Props) {
	return html`
    <div id="header" class="text-center border-bottom border-primary">      
      <p class= "fs-2"><i class="bi bi-caret-left-fill text-primary" onclick="history.back()"></i>Lists</p>    
    </div>
    <div class="container">
      <div>        
        ${items?.map((item, i) => {
					return html`
              <div class="card mt-2">
                <div class="card-body d-flex align-items-center">
                <button class="btn btn-primary me-2" disabled>
                  <i class="bi bi-list-stars"></i>
                </button>
                <form action="/lists" method="post" class="d-inline">
                  <input type="hidden" name="uri" value="${item.uri}">
                  <input type="hidden" name="name" value="${item.name}">                      
                  <button class="btn" type="submit">
                  ${item.name} - ${item.description}
                  </button>          
                </form>                                        
                </div>                  
              </div>
            `;
				})}
      </div>
    </div>
  `;
}
