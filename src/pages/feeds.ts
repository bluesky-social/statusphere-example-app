import { AppBskyActorDefs } from "@atproto/api";
import { html } from "../lib/view";
import { shell } from "./shell";
import type AppBskyActorDefsSavedFeedPrefv2 from "@atproto/api";

type Props = { 
  error?: string;
  savedFeeds?: AppBskyActorDefsSavedFeedPrefv2[];

};

export function feeds(props: Props) {
	return shell({
		title: "Feeds page",
		content: content(props),
	});
}

function content({ error }: Props) {
	return html`
    <div id="header" class="text-center">
      <h1>A New Feeds Page</h1>
      <p>It's time to build your next page.</p>
    </div>
    <div class="container">
      <div>
        You can add your content here.
      </div>
    </div>
  `;
}
