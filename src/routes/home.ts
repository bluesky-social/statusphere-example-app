import express from "express";
import type { AppContext } from "#/index";
import * as Profile from "#/lexicon/types/app/bsky/actor/profile";
import { getSessionAgent, handler } from "#/lib/utils";
import { page } from "#/lib/view";
import { home } from "#/pages/home";
import { login } from "#/pages/login";

export const createHomeRouter = (ctx: AppContext) => {
	const router = express.Router();

	// Homepage
	router.get(
		"/",
		handler(async (req, res) => {
			// If the user is signed in, get an agent which communicates with their server
			const agent = await getSessionAgent(req, res, ctx);

			// Fetch data stored in mongodb
			const db = ctx.dbm.db("statusphere");
			const collection = db.collection("status");
			const statuses = await collection
				.find({})
				.sort({ indexedAt: -1 })
				.toArray()
				.then((docs) =>
					docs.map((doc) => ({
						uri: doc.uri,
						authorDid: doc.authorDid,
						status: doc.status,
						createdAt: doc.createdAt,
						indexedAt: doc.indexedAt,
					})),
				);

			// Map user DIDs to their domain-name handles
			const didHandleMap = await ctx.resolver.resolveDidsToHandles(
				statuses.map((s) => s.authorDid),
			);

			if (!agent) {
				// Serve the logged-out view
				return res.type("html").send(page(login({})));
			}

			// Fetch additional information about the logged-in user
			const { data: profileRecord } = await agent.com.atproto.repo.getRecord({
				repo: agent.assertDid,
				collection: "app.bsky.actor.profile",
				rkey: "self",
			});
			const profile =
				Profile.isRecord(profileRecord.value) &&
				Profile.validateRecord(profileRecord.value).success
					? profileRecord.value
					: {};

			// Serve the logged-in view
			return res.type("html").send(
				page(
					home({
						statuses,
						didHandleMap,
						profile,
					}),
				),
			);
		}),
	);
	return router;
};
