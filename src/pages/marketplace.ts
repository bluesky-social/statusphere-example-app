import { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { html } from "../lib/view";
import { shell } from "./shell";

type Props = { 
  error?: string;
  profile?: ProfileViewDetailed; };

export function marketplace(props: Props) {
	return shell({
		title: "Marketplace page",
		content: content(props),
	});
}

function content({ error, profile }: Props) {
	return html`
    <div id="header" class="text-center border-bottom border-primary">      
      <p class= "fs-2"><i class="bi bi-caret-left-fill text-primary" onclick="history.back()"></i>Marketplace</p>    
    </div>
    <div class="container">      
      <div>
      ${profile?.displayName}
      </div>
    </div>
  `;
}
