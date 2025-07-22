import { db } from '../db/db';
import { v4 as uuidv4 } from 'uuid';

import { schedules } from '../db/schema';
import { getDateRange } from '../util/date';

const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN!;
const SLACK_CHANNEL = process.env.SLACK_SCHEDULECHANNEL_ID!;

export async function showScheduleModal(trigger_id: string) {
  const modal = {
    trigger_id,
    view: {
      type: "modal",
      callback_id: "schedule_modal",
      title: { type: "plain_text", text: "📅 일정 등록" },
      submit: { type: "plain_text", text: "등록" },
      close: { type: "plain_text", text: "취소" },
      blocks: [
        {
          type: "input",
          block_id: "start_block",
          label: { type: "plain_text", text: "시작일" },
          element: {
            type: "datepicker",
            action_id: "start_date",
            placeholder: { type: "plain_text", text: "시작일 선택" },
          },
        },
        {
          type: "input",
          block_id: "end_block",
          optional: true,
          label: { type: "plain_text", text: "종료일" },
          element: {
            type: "datepicker",
            action_id: "end_date",
            placeholder: { type: "plain_text", text: "종료일 선택 (선택사항)" },
          },
        },
        {
          type: "input",
          block_id: "type_block",
          label: { type: "plain_text", text: "일정 종류" },
          element: {
            type: "static_select",
            action_id: "schedule_type",
            placeholder: { type: "plain_text", text: "종류 선택" },
            options: [
              { text: { type: "plain_text", text: "휴가" }, value: "휴가" },
              { text: { type: "plain_text", text: "병가" }, value: "병가" },
              { text: { type: "plain_text", text: "오전반차" }, value: "오전반차" },
              { text: { type: "plain_text", text: "오후반차" }, value: "오후반차" },
              { text: { type: "plain_text", text: "외근" }, value: "외근" },
              { text: { type: "plain_text", text: "출장" }, value: "출장" },
            ],
          },
        },
        {
          type: 'input',
          block_id: 'reason_block',
          optional: true,
          label: { type: 'plain_text', text: '사유' },
          element: {
            type: 'plain_text_input',
            action_id: 'reason_input',
          },
        },
      ],
    },
  };

  await fetch('https://slack.com/api/views.open', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SLACK_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(modal),
  });
}


export async function postScheduleMessage(payload: any) {
  const state = payload.view.state.values;
  const userId = payload.user.id;
  const startDate = state.start_block.start_date.selected_date;
  const endDate = state.end_block?.end_date?.selected_date || startDate;
  const type = state.type_block.schedule_type.selected_option.value;
  const reason = state.reason_block?.reason_input?.value || '';

  const userInfo = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
    },
  }).then(res => res.json()).catch(()=>({}));

  const user = userInfo?.user?.profile?.display_name || userInfo?.user?.real_name || `<@${userId}>`;

  // 날짜 포맷
  const dateText =
    startDate === endDate ? startDate : `${startDate} ~ ${endDate}`;

  // 메시지 구성
  const text = `📅 *일정 등록*
• 등록자: ${user}
• 일정: ${dateText}
• 종류: ${type} ${reason ? `
• 사유: ${reason}` : ''}
`;

  const rows = getDateRange(startDate, endDate).map((date) => ({
    id: uuidv4(),
    user,
    date,
    type,
    reason,
  }));

  await db.insert(schedules).values(rows);

  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SLACK_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: SLACK_CHANNEL,
      text,
    }),
  });
}
