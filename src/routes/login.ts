import { OAuthResolverError } from "@atproto/oauth-client-node";
import { isValidHandle } from "@atproto/syntax";
import express from "express";
import type { AppContext } from "#/index";
import { handler } from "#/lib/utils";
import { page } from "#/lib/view";
import { login } from "#/pages/login";

export const createLoginRouter = (ctx: AppContext) => {
	const router = express.Router();

	// Login page
	router.get(
		"/login",
		handler(async (_req, res) => {
			return res.type("html").send(page(login({})));
		}),
	);

	// Login handler
	router.post(
		"/login",
		handler(async (req, res) => {
			// Validate
			const handle = req.body?.handle;
			if (typeof handle !== "string" || !isValidHandle(handle)) {
				return res.type("html").send(page(login({ error: "invalid handle" })));
			}

			// Initiate the OAuth flow
			try {
				const url = await ctx.oauthClient.authorize(handle, {
					scope: "atproto transition:generic",
				});
				return res.redirect(url.toString());
			} catch (err) {
				ctx.logger.error({ err }, "oauth authorize failed");
				return res.type("html").send(
					page(
						login({
							error:
								err instanceof OAuthResolverError
									? err.message
									: "couldn't initiate login",
						}),
					),
				);
			}
		}),
	);

	return router;
};
