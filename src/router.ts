import express from "express";
import type { AppContext } from "#/config";

export const createRouter = (ctx: AppContext) => {
  const router = express.Router();

  router.get("/", async (req, res) => {
    const posts = await ctx.db
      .selectFrom("post")
      .selectAll()
      .orderBy("indexedAt", "desc")
      .limit(10)
      .execute();
    const postTexts = posts.map((row) => row.text);
    res.json(postTexts);
  });

  return router;
};
