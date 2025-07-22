import { Hono } from 'hono';

import { db } from '../db/db';

export const manageRoutes = new Hono();

manageRoutes.get('/', async (c) => {
  return c.text(''); // Acknowledge
});

manageRoutes.get('/schedule-clear', async (c) => {
  const all = await db.delete(schedules);
  return c.json(all);
});

manageRoutes.get('/schedule', async (c) => {
  const today = c.req.query('today');

  if (today) {
    // 특정 날짜 조회
    const results = await db
      .select()
      .from(schedules)
      .where(eq(schedules.date, today));

    // 타입별로 그룹화
    const grouped: Record<string, string[]> = {};
    for (const row of results) {
      if (!grouped[row.type]) {
        grouped[row.type] = [];
      }
      grouped[row.type].push(row.name);
    }

    return c.json(grouped);
  }

  // 전체 조회
  const all = await db.select().from(schedules);
  return c.json(all);
});
