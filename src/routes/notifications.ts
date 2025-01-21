import express from "express";
import type { AppContext } from "#/index";
import { getSessionAgent, handler } from "#/lib/utils";
import { page } from "#/lib/view";
import { login } from "#/pages/login";
import { notifications } from "#/pages/notifications";

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
			const { notifications: NotificationView , cursor: nextPage } = notify.data;			

			return res.type("html").send(page(notifications({ notifications: NotificationView })));
		}),
	);

	return router;
};
