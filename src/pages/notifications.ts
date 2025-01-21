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
    <p class="fs-2"><i class="bi bi-caret-left-fill text-primary" onclick="history.back()"></i>Notifications</p>    
  </div>
  <div class="container">
  ${notifications.map((notification: NotificationView , i: number) => {
    return html`
    <div class="row bg-light mt-3 border border-primary rounded">
      <div class="col-2">
        <img src="${notification.author.avatar}" class="img-fluid rounded-circle img-thumbnail" alt="${notification.author.displayName}" />
      </div>
      <div class="col-5">${notification.author.displayName}</div>
      <div class="col-5">${notification.reason}</div>
      
    </div>`;
  })}
  </div>
  `;
}
