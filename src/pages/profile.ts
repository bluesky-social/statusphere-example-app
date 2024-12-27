import { html } from '../lib/view'
import { shell } from './shell'

type Props = { error?: string }

export function profile(props: Props) {
  return shell({
    title: 'Profile page',
    content: content(props),
  })
}

function content({ error }: Props) {
  return html`<div id="root">
  <!-- start here -->
    <div class="container-fluid">
      <div class="row text-center my-2">
        <div class="col border border-primary rounded ms-2"> <!-- left content goes here -->
          <ul class="list-group list-group-flush">
            <li class="list-group-item">An item</li>
            <li class="list-group-item">A second item</li>
            <li class="list-group-item">A third item</li>
            <li class="list-group-item">A fourth item</li>
            <li class="list-group-item">And a fifth one</li>
          </ul>
          <form action="/logout" method="post" class="session-form">
            <div class="m-2">
              <button type="submit" class="btn btn-primary">Log out</button>
            </div>
          </form>
        </div>
        <div class="col-6 border border-primary rounded ms-2"><!-- center content goes here -->
          <div id="header" class="text-center">
            <h1>A New Profile Page</h1>
            <p>It's time to build your next page.</p>
          </div>
          <div class="container">
            <div>
              You can add your content here.
            </div>
            <div class="text-center">
              Don't have an account on the Atmosphere?
              <a href="https://bsky.app">Sign up for Bluesky</a> to create one now!
            </div>
          </div>
        </div>
        <div class="col border border-primary rounded mx-2">right side content goes here</div>
      </div>
    </div>
    <!--end here -->
  </div>`
}
