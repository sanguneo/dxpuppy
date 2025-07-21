import { Hono } from "hono";
import { slackRoutes } from "./routes/slack";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.route("/slack", slackRoutes);

export default {
  port: 65432,
  fetch: app.fetch,
};
