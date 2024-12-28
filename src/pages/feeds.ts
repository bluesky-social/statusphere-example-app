import { html } from '../lib/view'
import { shell } from './shell'

type Props = { error?: string }

export function feeds(props: Props) {
  return shell({
    title: 'Feeds page',
    content: content(props),
  })
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
      <div class="text-center">
        Don't have an account on the Atmosphere?
        <a href="https://bsky.app">Sign up for Bluesky</a> to create one now!
      </div>
    </div>
  `
}
