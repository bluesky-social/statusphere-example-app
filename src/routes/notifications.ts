import express from "express";
import type { AppContext } from "#/index";
import { getSessionAgent, handler } from "#/lib/utils";
import { page } from "#/lib/view";
import { login } from "#/pages/login";
import { notifications } from "#/pages/notifications";
import type { Notification as NotificationView } from "@atproto/api/src/client/types/app/bsky/notification/listNotifications";

export const createNotificationsRouter = (ctx: AppContext) => {
	const router = express.Router();

	// Notifications page
	router.get(
		"/notifications",
		handler(async (req, res) => {
			// If the user is signed in, get an agent which communicates with their server
			const agent = await getSessionAgent(req, res, ctx);
			// If the user is not logged in send them to the login page.
			if (!agent) {
				return res.type("html").send(page(login({})));
			}

			const notify = await agent.app.bsky.notification.listNotifications();
			//console.log(JSON.stringify(notify.data));

			const { notifications: NotificationView , cursor: nextPage } = notify.data;

			/*
			const { feed: postsArray, cursor: nextPage } = notify.data;
	 		// sort decending by createdAt
			postsArray.sort((a, b) =>
				(a.post.record as { createdAt: string }).createdAt >
				(b.post.record as { createdAt: string }).createdAt
					? -1
					: 1,
			);
			*/

			return res.type("html").send(page(notifications({ notifications: NotificationView })));
		}),
	);

	return router;
};
