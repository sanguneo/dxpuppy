import dayjs from "dayjs";
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';

import { db } from '../db/db';
import { schedules } from '../db/schema';

const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN!;
const SLACK_CHANNEL = process.env.SLACK_SCHEDULECHANNEL_ID!;

const TYPE_ORDER = ['휴가', '병가', '오전반차', '오후반차', '외근', '출장'];

function formatScheduleMessage(date: string, grouped: Record<string, string[]>) {
  const lines: string[] = [`📅 *${date} 일정 공유*\n`];

  for (const type of TYPE_ORDER) {
    const names = grouped[type] || [];

    lines.push(`• *${type}*`);
    if (names.length > 0) {
      for (const name of names) {
        lines.push(`- ${name}`);
      }
    } else {
      lines.push(`- 없음`);
    }
    lines.push(''); // 빈 줄로 분리
  }

  return lines.join('\n');
}


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
      grouped[row.type].push(row.user);
    }

    return c.json(grouped);
  }

  // 전체 조회
  const all = await db.select().from(schedules);
  return c.json(all);
});

manageRoutes.get('/schedule-post', async (c) => {
  const today = dayjs().format('YYYY-MM-DD');

  // 특정 날짜 조회
  const results = await db
    .select()
    .from(schedules)
    .where(eq(schedules.date, today));

  // 타입별로 그룹화
  const grouped: Record<string, string[]> = {};
  if (!results.length) return c.text('no results');
  for (const row of results) {
    if (!grouped[row.type]) {
      grouped[row.type] = [];
    }
    grouped[row.type].push(row.user);
  }

  const text = formatScheduleMessage(today, grouped);

  try {
    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SLACK_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: SLACK_CHANNEL,
        text,
      }),
    });
    return c.json(grouped);
  } catch {
    return c.text('error', 400);
  }
});
