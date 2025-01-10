import { html } from "../lib/view";
import { shell } from "./shell";

type Props = { error?: string };

export function lists(props: Props) {
	return shell({
		title: "Lists page",
		content: content(props),
	});
}

function content({ error }: Props) {
	return html`
    <div id="header" class="text-center border-bottom border-primary">      
      <p class= "fs-2"><i class="bi bi-caret-left-fill text-primary" onclick="history.back()"></i>Lists</p>    
    </div>
    <div class="container">
      <div>
        You can add your content here.
      </div>
    </div>
  `;
}
