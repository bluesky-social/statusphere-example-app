import express from 'express'
import { handler, getSessionAgent } from '#/lib/utils'
import { AppContext } from '#/index'
import { page } from "#/lib/view";
import { marketplace } from "#/pages/marketplace";
import { login } from '#/pages/login'

export const createMarketplaceRouter = (ctx: AppContext) => {
  const router = express.Router()
  
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

  return router
}