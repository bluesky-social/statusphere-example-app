import express from 'express'
import { handler, getSessionAgent } from '#/lib/utils'
import { AppContext } from '#/index'
import { getIronSession } from "iron-session";
import { env } from "#/lib/env";

type Session = { did: string };

export const createLogoutRouter = (ctx: AppContext) => {
  const router = express.Router()
  
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

  return router
}
