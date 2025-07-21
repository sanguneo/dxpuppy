import { Hono } from 'hono';
import { showIncidentModal, postIncidentMessage } from '../controller/incident';

export const slackRoutes = new Hono();

slackRoutes.post('/command', async (c) => {
  const body = await c.req.parseBody();
  const commandText = body.text?.toString().trim();
  const trigger_id = body.trigger_id?.toString();

  if (commandText === '장애' && trigger_id) {
    await showIncidentModal(trigger_id);
  }

  return c.text(''); // empty 200 response
});

slackRoutes.post('/interactive', async (c) => {
  const body = await c.req.parseBody();
  const payload = JSON.parse(body.payload as string);

  if (payload.type === 'view_submission' && payload.view.callback_id === 'incident_modal') {
    await postIncidentMessage(payload);
  }

  return c.text(''); // Acknowledge
});
