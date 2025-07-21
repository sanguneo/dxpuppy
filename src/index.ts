import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { slackRoutes } from './routes/slack';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.route('/slack', slackRoutes);

export default {
  port: 65432,
  fetch: app.fetch,
};
