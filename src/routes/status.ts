import express from 'express'
import { handler, getSessionAgent } from '#/lib/utils'
import { AppContext } from '#/index'
import { page } from "#/lib/view";
import { home } from "#/pages/home";
import { login } from '#/pages/login'
import * as Status from "#/lexicon/types/xyz/statusphere/status";
import { TID } from "@atproto/common";

export const createStatusRouter = (ctx: AppContext) => {
  const router = express.Router()
  
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

  return router
}
