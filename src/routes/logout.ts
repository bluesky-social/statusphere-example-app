import express from "express";
import { getIronSession } from "iron-session";
import type { AppContext } from "#/index";
import { env } from "#/lib/env";
import { getSessionAgent, handler } from "#/lib/utils";

type Session = { did: string };

export const createLogoutRouter = (ctx: AppContext) => {
	const router = express.Router();

	// Logout handler
	router.post(
		"/logout",
		handler(async (req, res) => {
			const session = await getIronSession<Session>(req, res, {
				cookieName: "sid",
				password: env.COOKIE_SECRET,
			});
			await session.destroy();
			return res.redirect("/");
		}),
	);

	return router;
};
