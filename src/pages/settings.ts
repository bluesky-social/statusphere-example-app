import { html } from "../lib/view";
import { shell } from "./shell";

type Props = { error?: string };

export function settings(props: Props) {
	return shell({
		title: "Settings page",
		content: content(props),
	});
}

function content({ error }: Props) {
	return html`
    <div id="header" class="text-center border-bottom border-primary">      
      <p class= "fs-2"><i class="bi bi-caret-left-fill text-primary" onclick="history.back()"></i>Settings</p>    
    </div>
    <div class="container">
      <div>
        Not yet but we're working on it.
      </div>
    </div>
  `;
}
