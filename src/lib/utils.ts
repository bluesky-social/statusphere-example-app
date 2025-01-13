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

export { handler, getSessionAgent }
