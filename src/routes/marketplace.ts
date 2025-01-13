import express from "express";
import type { AppContext } from "#/index";
import { getSessionAgent, handler } from "#/lib/utils";
import { page } from "#/lib/view";
import { login } from "#/pages/login";
import { marketplace } from "#/pages/marketplace";

export const createMarketplaceRouter = (ctx: AppContext) => {
	const router = express.Router();

	// Marketplace page
	router.get(
		"/marketplace",
		handler(async (req, res) => {
			// If the user is signed in, get an agent which communicates with their server
			const agent = await getSessionAgent(req, res, ctx);
			// If the user is not logged in send them to the login page.
			if (!agent) {
				return res.type("html").send(page(login({})));
			}
			return res.type("html").send(page(marketplace({})));
		}),
	);

	return router;
};
