import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { slackRoutes } from './routes/slack';
import { manageRoutes } from './routes/manage';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.route('/slack', slackRoutes);
app.route('/manage', manageRoutes);

export default {
  port: 65432,
  fetch: app.fetch,
};
