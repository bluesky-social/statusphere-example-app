import { type Hole, html } from "../lib/view";

export function shell({ title, content }: { title: string; content: Hole }) {
	return html`<html data-bs-theme="dark">
    <head>
      <script src="/js/bootstrap.bundle.min.js"></script>
      <script src="/public/js/color-modes.js"></script>
      <script src="/public/js/up-button.js"></script>
      <script src="/vid/video.min.js" defer></script>
      
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      <link rel="stylesheet" href="/css/bootstrap.min.css" />
      <link rel="stylesheet" href="/icons/bootstrap-icons.min.css">
      <link rel="stylesheet" href="/vid/video-js.min.css">
    </head>
    <body>      
      <div id="root">
        <button id="upBtn" type= "button" class= "btn btn-primary m-3 position-fixed bottom-0 end-0"><i class="bi bi-caret-up-fill"></i></button>
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
                <a href="/status" class="list-group-item list-group-item-action list-group-item-light"><i class="bi bi-clipboard2-check"></i> Status</a>
                <a href="/profile" class="list-group-item list-group-item-action list-group-item-light"><i class="bi bi-person"></i> Profile</a>
                <a href="/settings" class="list-group-item list-group-item-action list-group-item-light"><i class="bi bi-gear"></i> Settings</a>
                <a href="/marketplace" class="list-group-item list-group-item-action list-group-item-light"><i class="bi bi-shop"></i> Marketplace</a>
              </div>
              <form action="/logout" method="post" class="session-form">
                <div class="m-2">
                  <button type="submit" class="btn text-danger-emphasis"><i class="bi bi-box-arrow-right"></i> Sign out</button>
                  <button type="submit" class="btn btn-success float-end"><i class="bi bi-pencil"></i> New Post</button>
                </div>
              </form>
            </div>
            <div class="col-6 border border-primary rounded ms-2 pb-2"><!-- center content goes here -->
              ${content}
            </div>
            <div class="col border border-primary rounded mx-2 text-center"> <!-- right side content goes here -->
              <button type="button" class="btn" data-bs-theme-value="light" aria-pressed="false">
                <i class="bi bi-sun-fill"></i><span class="ms-2">Light</span>
              </button>
              <button type="button" class="btn" data-bs-theme-value="dark" aria-pressed="true">
                <i class="bi bi-moon-stars-fill"></i><span class="ms-2">Dark</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>`;
}
