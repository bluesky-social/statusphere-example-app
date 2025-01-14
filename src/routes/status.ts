import { TID } from "@atproto/common";
import express from "express";
import type { AppContext } from "#/index";
import * as Status from "#/lexicon/types/xyz/statusphere/status";
import { getSessionAgent, handler } from "#/lib/utils";
import { page } from "#/lib/view";
import { status } from "#/pages/status";
import { login } from "#/pages/login";
import * as Profile from "#/lexicon/types/app/bsky/actor/profile";

export const createStatusRouter = (ctx: AppContext) => {
	const router = express.Router();

	// Status page
		router.get(
			"/status",
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
						status({
							statuses,
							didHandleMap,
							profile,
						}),
					),
				);
			}),
		);

	// "Set status" handler
	router.post(
		"/status",
		handler(async (req, res) => {
			// If the user is signed in, get an agent which communicates with their server
			const agent = await getSessionAgent(req, res, ctx);
			if (!agent) {
				return res
					.status(401)
					.type("html")
					.send("<h1>Error: Session required</h1>");
			}

			// Construct & validate their status record
			const rkey = TID.nextStr();
			const record = {
				$type: "xyz.statusphere.status",
				status: req.body?.status,
				createdAt: new Date().toISOString(),
			};
			if (!Status.validateRecord(record).success) {
				return res
					.status(400)
					.type("html")
					.send("<h1>Error: Invalid status</h1>");
			}

			try {
				// Write the status record to the user's repository
				// This is where the new record gets sent to the PDS and goes to the firehose
				const res = await agent.com.atproto.repo.putRecord({
					repo: agent.assertDid,
					collection: "xyz.statusphere.status",
					rkey,
					record,
					validate: false,
				});
				const uri = res.data.uri;
			} catch (err) {
				ctx.logger.warn({ err }, "failed to write record");
				return res
					.status(500)
					.type("html")
					.send("<h1>Error: Failed to write record</h1>");
			}
			return res.redirect("/");
		}),
	);

	return router;
};
