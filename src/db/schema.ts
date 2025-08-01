import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const schedules = sqliteTable('schedules', {
  id: text('id').primaryKey(), // uuid
  user: text('user').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  type: text('type').notNull(), // 휴가, 외근 등
  reason: text('reason'), // 사유
});
