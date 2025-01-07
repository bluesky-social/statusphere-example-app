import { html } from "../lib/view";
import { shell } from "./shell";

type Props = { error?: string };

export function search(props: Props) {
	return shell({
		title: "Search page",
		content: content(props),
	});
}

function content({ error }: Props) {
	return html`
    <div id="header" class="text-center">
      <h1>A New Search Page</h1>
      <p>It's time to build your next page.</p>
    </div>
    <div class="container">
      <div>
        You can add your content here.
      </div>
    </div>
  `;
}
