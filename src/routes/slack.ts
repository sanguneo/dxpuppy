import { Hono } from 'hono';
import { showIncidentModal, postIncidentMessage } from '../controller/incident';
import { showScheduleModal, postScheduleMessage } from '../controller/schedule';

export const slackRoutes = new Hono();

slackRoutes.post('/command', async (c) => {
  const body = await c.req.parseBody();
  const commandText = body.text?.toString().trim();
  const trigger_id = body.trigger_id?.toString();

  if (trigger_id) {
    switch (commandText) {
      case '장애':
        await showIncidentModal(trigger_id);
        break;
      case '일정':
        await showScheduleModal(trigger_id);
        break;
    }
  }
  return c.text(''); // empty 200 response
});

slackRoutes.post('/interactive', async (c) => {
  const body = await c.req.parseBody();
  const payload = JSON.parse(body.payload as string);

  if (payload.type === 'view_submission' && payload.view.callback_id) {
    switch (payload.view.callback_id) {
      case 'incident_modal':
        await postIncidentMessage(payload);
        break;
      case 'schedule_modal':
        await postScheduleMessage(payload);
        break;
    }
  }

  return c.text(''); // Acknowledge
});
