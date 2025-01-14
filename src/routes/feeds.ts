import type { SavedFeedsPrefV2 } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import express from "express";
import type { AppContext } from "#/index";
import { getSessionAgent, handler } from "#/lib/utils";
import { page } from "#/lib/view";
import { feeds } from "#/pages/feeds";
import { login } from "#/pages/login";
import { home } from "#/pages/home";

export const createFeedsRouter = (ctx: AppContext) => {
	const router = express.Router();

	// Feeds page
	router.get(
		"/feeds",
		handler(async (req, res) => {
			// If the user is signed in, get an agent which communicates with their server
			const agent = await getSessionAgent(req, res, ctx);
			// If the user is not logged in send them to the login page.
			if (!agent) {
				return res.type("html").send(page(login({})));
			}

			const preferences = await agent.app.bsky.actor.getPreferences();
			const { items } = preferences.data.preferences[9] as SavedFeedsPrefV2;

			return res.type("html").send(page(feeds({ items })));
		}),
	);

	router.post(
		"/feeds",
		handler(async (req, res) => {
			// If the user is signed in, get an agent which communicates with their server
			const agent = await getSessionAgent(req, res, ctx);
			// If the user is not logged in send them to the login page.
			if (!agent) {
				return res.type("html").send(page(login({})));
			}

			const feedName = req.body.value.substring(
				req.body.value.lastIndexOf("/") + 1,
			);

			const { data } = await agent.app.bsky.feed.getFeed({
				feed: req.body.value,
				limit: 30,
			});

			const { feed: postsArray, cursor: nextPage } = data;

			return res.type("html").send(page(home({ postsArray, feedName })));
		}),
	);

	return router;
};
