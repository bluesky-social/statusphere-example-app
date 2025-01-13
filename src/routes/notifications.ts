import express from 'express'
import { handler, getSessionAgent } from '#/lib/utils'
import { AppContext } from '#/index'
import { page } from "#/lib/view";
import { notifications } from "#/pages/notifications";
import { login } from '#/pages/login'

export const createNotificationsRouter = (ctx: AppContext) => {
  const router = express.Router()
  
  // Notifications page
    router.get(
      "/notifications",
      handler(async (req, res) => {
        // If the user is signed in, get an agent which communicates with their server
        const agent = await getSessionAgent(req, res, ctx);
        // If the user is not logged in send them to the login page.
        if (!agent) {
          return res.type("html").send(page(login({})));
        }
        return res.type("html").send(page(notifications({})));
      }),
    );

  return router
}
