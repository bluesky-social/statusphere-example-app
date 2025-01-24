import { html } from "../lib/view";
import { shell } from "./shell.logout";

type Props = { error?: string };

export function login(props: Props) {
	return shell({
		title: "Log in",
		content: content(props),
	});
}

function content({ error }: Props) {
	return html`<div id="root">
    <div class="container border border-primary rounded mt-3 p-3">
      <div id="header" class="row">
        <div class="col text-center">
          <h1 class= "text-primary"><i class="bi bi-shop"></i> SocialAtm</h1>
          <p>Authenticated Transfer Marketplace.</p>
        </div>
      </div>

      <form action="/login" method="post" class="login-form">
        <div id="middle" class="row">
          <div class="col">
          </div>
          <div class="col-6">
            <input class="form-control mb-2"
            type="text"
            name="handle"
            placeholder="Enter your handle (eg alice.bsky.social)"
            required
            />
          </div>
          <div class="col">
            <button type="submit" class="btn btn-primary">Sign in</button>
          </div>
        </div>
        ${error ? html`<p>Error: <i>${error}</i></p>` : undefined}
      </form>

      <div class="row mt-5" id="footer">
        <div class="col text-center">
          Don't have an account on the Atmosphere?
          <a href="https://bsky.app">Sign up for Bluesky</a> to create one now!
        </div>
      </div>
    </div>
  </div>`;
}
