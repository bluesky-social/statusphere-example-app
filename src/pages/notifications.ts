import { html } from "../lib/view";
import { shell } from "./shell";
import type { Notification as NotificationView } from "@atproto/api/src/client/types/app/bsky/notification/listNotifications";

type Props = { 
  error?: string,
  notifications: NotificationView[]
};

export function notifications(props: Props) {
	return shell({
		title: "Notifications page",
		content: content(props),
	});
}

function content({ error, notifications }: Props) {
	return html`
    <div id="header" class="text-center border-bottom border-primary">      
      <p class= "fs-2"><i class="bi bi-caret-left-fill text-primary" onclick="history.back()"></i>Notifications</p>    
    </div>
    <div class="container">
      <div>
        Not yet but we're working on it.${notifications[0].author.displayName}
      </div>
    </div>
  `;
}
