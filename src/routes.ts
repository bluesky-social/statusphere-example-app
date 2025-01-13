import assert from "node:assert";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { Agent } from "@atproto/api";
//import { TID } from "@atproto/common";
//import { OAuthResolverError } from "@atproto/oauth-client-node";
//import { isValidHandle } from "@atproto/syntax";
import express from "express";
import { rateLimit } from "express-rate-limit";
import { getIronSession } from "iron-session";
import type { AppContext } from "#/index";
import * as Profile from "#/lexicon/types/app/bsky/actor/profile";
import { env } from "#/lib/env";
import { page } from "#/lib/view";
import { home } from "#/pages/home";
import { login } from "#/pages/login";
import { createBlankRouter } from './routes/blank'
import { createMarketplaceRouter } from './routes/marketplace'
import { createSettingsRouter } from './routes/settings'
import { createProfileRouter } from './routes/profile'
import { createListsRouter } from './routes/lists'
import { createFeedsRouter } from './routes/feeds'
import { createChatRouter } from './routes/chat'
import { createNotificationsRouter } from './routes/notifications'
import { createSearchRouter } from './routes/search'
import { createStatusRouter } from './routes/status'
import { createHomeRouter } from './routes/home'
import { createLogoutRouter } from './routes/logout'
import { createLoginRouter } from './routes/login'

const limiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	limit: 1666,
	standardHeaders: "draft-8",
	legacyHeaders: false,
});

type Session = { did: string };

// Helper function for defining routes
const handler =
	(fn: express.Handler) =>
	async (
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => {
		try {
			await fn(req, res, next);
		} catch (err) {
			next(err);
		}
	};

// Helper function to get the Atproto Agent for the active session
async function getSessionAgent(
	req: IncomingMessage,
	res: ServerResponse<IncomingMessage>,
	ctx: AppContext,
) {
	const session = await getIronSession<Session>(req, res, {
		cookieName: "sid",
		password: env.COOKIE_SECRET,
	});
	if (!session.did) return null;
	try {
		const oauthSession = await ctx.oauthClient.restore(session.did);
		return oauthSession ? new Agent(oauthSession) : null;
	} catch (err) {
		ctx.logger.warn({ err }, "oauth restore failed");
		await session.destroy();
		return null;
	}
}

export const createRouter = (ctx: AppContext) => {
	const router = express.Router();
	router.use(limiter);

	// Static assets
	router.use(
		"/public",
		express.static(path.join(__dirname, "pages", "public")),
	);
	router.use("/js", express.static("./node_modules/bootstrap/dist/js"));
	router.use("/vid", express.static("./node_modules/video.js/dist"));
	router.use("/icons", express.static("./node_modules/bootstrap-icons/font"));
	router.use("/css", express.static("./node_modules/bootswatch/dist/united"));

	router.use(createBlankRouter(ctx))
	router.use(createMarketplaceRouter(ctx))
	router.use(createSettingsRouter(ctx))
	router.use(createProfileRouter(ctx))
	router.use(createListsRouter(ctx))
	router.use(createFeedsRouter(ctx))
	router.use(createChatRouter(ctx))
	router.use(createNotificationsRouter(ctx))
	router.use(createSearchRouter(ctx))
	router.use(createStatusRouter(ctx))
	router.use(createHomeRouter(ctx))
	router.use(createLogoutRouter(ctx))
	router.use(createLoginRouter(ctx))	

	// OAuth metadata
	router.get(
		"/client-metadata.json",
		handler((_req, res) => {
			return res.json(ctx.oauthClient.clientMetadata);
		}),
	);

	// OAuth callback to complete session creation
	router.get(
		"/oauth/callback",
		handler(async (req, res) => {
			const params = new URLSearchParams(req.originalUrl.split("?")[1]);
			try {
				const { session } = await ctx.oauthClient.callback(params);
				const clientSession = await getIronSession<Session>(req, res, {
					cookieName: "sid",
					password: env.COOKIE_SECRET,
				});
				assert(!clientSession.did, "session already exists");
				clientSession.did = session.did;
				await clientSession.save();
			} catch (err) {
				ctx.logger.error({ err }, "oauth callback failed");
				return res.redirect("/?error");
			}
			return res.redirect("/");
		}),
	);	

	return router;
};
