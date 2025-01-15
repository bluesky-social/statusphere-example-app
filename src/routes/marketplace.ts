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

			// let's add them to the database
			const { data } = await agent.getProfile({ actor: agent.assertDid });
			const profile = data;
			
			const db = ctx.dbm.db("statusphere");
			const collection = db.collection("profile");

			// insert the profile into the database or update it if it's already there
			const result = await collection.updateOne(
				{ did: profile.did },
				{
					$set: {
						handle: profile.handle,
						displayName: profile.displayName,
						avatar: profile.avatar,
						createdAt: profile.createdAt,
						indexedAt: profile.indexedAt,
					}
				},
				{ upsert: true }
			);

			console.log(`New listing created with the following id: ${result.upsertedId}`);
			console.log(`was listing updated: ${result.acknowledged}`);

			return res.type("html").send(page(marketplace({profile})));
		}),
	);

	return router;
};
