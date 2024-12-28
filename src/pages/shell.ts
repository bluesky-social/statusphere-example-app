import { type Hole, html } from '../lib/view'

export function shell({ title, content }: { title: string; content: Hole }) {
  return html`<html>
    <head>
      <script src="/public/js/color-modes.js"></script>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      <link rel="stylesheet" href="/public/css/bootstrap.min.css" />
      <link rel="stylesheet" href="/public/css/bootstrap-icons.min.css">
    </head>
    <body>
      <div id="root">
        <div class="container-fluid">
          <div class="row my-2 fw-bold">
            <div class="col border border-primary rounded ms-2"> <!-- left content goes here -->
              <div class="list-group list-group-flush">
                <a href="/" class="list-group-item list-group-item-action list-group-item-light"><i class="bi bi-house-door"></i> Home</a>
                <a href="/search" class="list-group-item list-group-item-action list-group-item-light"><i class="bi bi-search"></i> Search</a>
                <a href="/notifications" class="list-group-item list-group-item-action list-group-item-light"><i class="bi bi-bell"></i> Notifications</a>
                <a href="/chat" class="list-group-item list-group-item-action list-group-item-light"><i class="bi bi-chat-dots"></i> Chat</a>
                <a href="/feeds" class="list-group-item list-group-item-action list-group-item-light"><i class="bi bi-hash"></i> Feeds</a>
                <a href="/lists" class="list-group-item list-group-item-action list-group-item-light"><i class="bi bi-list-ul"></i> Lists</a>
                <a href="/profile" class="list-group-item list-group-item-action list-group-item-light"><i class="bi bi-person"></i> Profile</a>
                <a href="/settings" class="list-group-item list-group-item-action list-group-item-light"><i class="bi bi-gear"></i> Settings</a>
                <a href="/marketplace" class="list-group-item list-group-item-action list-group-item-light"><i class="bi bi-shop-window"></i> Marketplace</a>
              </div>
              <form action="/logout" method="post" class="session-form">
                <div class="m-2">
                  <button type="submit" class="btn btn-primary">Log out</button>
                </div>
              </form>
            </div>
            <div class="col-6 border border-primary rounded ms-2"><!-- center content goes here -->
              ${content}
            </div>
            <div class="col border border-primary rounded mx-2">
              right side content goes here
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>`
}
