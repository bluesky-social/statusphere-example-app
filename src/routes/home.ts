import express from "express";
import type { AppContext } from "#/index";
import { getSessionAgent, handler } from "#/lib/utils";
import { page } from "#/lib/view";
import { login } from "#/pages/login";
import { home } from "#/pages/home";

export const createHomeRouter = (ctx: AppContext) => {
	const router = express.Router();

	router.get(
		"/",
		handler(async (req, res) => {
			// If the user is signed in, get an agent which communicates with their server
			const agent = await getSessionAgent(req, res, ctx);
			// If the user is not logged in send them to the login page.
			if (!agent) {
				return res.type("html").send(page(login({})));
			}
						
			const feedName = "Following";
			const feed = await agent.getTimeline({
				
			  });
			  
			  const { feed: postsArray, cursor: nextPage } = feed.data;

			return res.type("html").send(
				page(
					home({						
						postsArray,
						feedName,
					}),
				),
			);
		}),
	);

	return router;
};
