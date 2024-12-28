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
  return html`
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
  `
}
