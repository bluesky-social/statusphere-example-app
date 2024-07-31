import type express from "express";
import { Post } from "#/db";

export const addRoutes = (app: express.Application) => {
  app.get("/", async (req, res) => {
    const posts = await Post.findAll({
      order: [["createdAt", "DESC"]],
      limit: 10,
    });
    const texts = posts.map((p) => p.dataValues.text);
    res.json(texts);
  });
};
