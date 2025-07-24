const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN!;
const SLACK_CHANNEL = process.env.SLACK_NOTICECHANNEL_ID!;

export async function showIncidentModal(trigger_id: string) {
  const modal = {
    trigger_id,
    view: {
      type: 'modal',
      callback_id: 'incident_modal',
      title: { type: 'plain_text', text: '장애 선언' },
      submit: { type: 'plain_text', text: '제출' },
      close: { type: 'plain_text', text: '취소' },
      blocks: [
        {
          type: 'input',
          block_id: 'tier_block',
          label: { type: 'plain_text', text: '장애 등급 (Tier)*' },
          element: {
            type: 'static_select',
            action_id: 'tier_select',
            options: ['Tier 0', 'Tier 1', 'Tier 2', 'Pre-Tier', 'None'].map((label) => ({
              text: { type: 'plain_text', text: label },
              value: label.toLowerCase().replace(' ', '_'),
            })),
          },
        },
        {
          type: 'input',
          block_id: 'service_block',
          label: { type: 'plain_text', text: '서비스 선택*' },
          element: {
            type: 'static_select',
            action_id: 'service_select',
            options: ['Xp전자결재', 'Xp문서함', 'Xp비서', '기타', '테스트'].map((label) => ({
              text: { type: 'plain_text', text: label },
              value: label.toLowerCase(),
            })),
          },
        },
        {
          type: 'input',
          block_id: 'date_block',
          label: { type: 'plain_text', text: '발생일 (날짜)' },
          element: {
            type: 'datepicker',
            action_id: 'date_select',
          },
        },
        {
          type: 'input',
          block_id: 'time_block',
          label: { type: 'plain_text', text: '발견 시간 (예: 14:30)' },
          element: {
            type: 'plain_text_input',
            action_id: 'time_input',
          },
        },
        {
          type: 'input',
          block_id: 'desc_block',
          label: { type: 'plain_text', text: '장애 내용' },
          element: {
            type: 'plain_text_input',
            action_id: 'desc_input',
            multiline: true,
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


export async function postIncidentMessage(payload: any) {
  const values = payload.view.state.values;
  const userId = payload.user.id;
  const username = payload.user.username;

  const userInfo = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
    },
  }).then(res => res.json());

  const displayName = userInfo?.user?.profile?.display_name || userInfo?.user?.real_name || username;

  const tier = values.tier_block.tier_select.selected_option.text.text;
  const service = values.service_block.service_select.selected_option.text.text;
  const date = values.date_block.date_select.selected_date;
  const time = values.time_block.time_input.value;
  const description = values.desc_block.desc_input.value;

  const text = `🚨 *장애 선언*
• *등록자*: <@${userId}>
• *등급*: ${tier}
• *서비스*: ${service}
• *발생 일시*: ${date} ${time}
• *내용*
\`\`\`
${description}
\`\`\`
<!channel>
`;

  await fetch('https://national-dodo-highly.ngrok-free.app/mailer', {
    method: 'post',
    body: JSON.stringify({
      from: "dxfe@aegisep.com",
      to: "\"나상권\" <sknah@aegisep.com>, \"이순리\" <srlee@aegisep.com>, \"송하람\" <haramsong@aegisep.com>, \"배영배\" <endless@aegisep.com>",
      subject: `🚨 ${service} 서비스 "${tier}" 장애 발생`, // 제목
      html: `<div style="max-width: 600px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
  <h2 style="color: #d32f2f;">🚨 장애 알림</h2>
  <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
    <tr>
      <td style="font-weight: bold; padding: 8px 0; font-size: 17px; width: 120px; ">등록자</td>
      <td style="padding: 8px 0;">${displayName}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; padding: 8px 0; font-size: 17px;">등급</td>
      <td style="padding: 8px 0;">${tier}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; padding: 8px 0; font-size: 17px;">서비스</td>
      <td style="padding: 8px 0;">${service}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; padding: 8px 0; font-size: 17px;">발생 일시</td>
      <td style="padding: 8px 0;">${date} ${time}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; padding: 8px 0; font-size: 17px; vertical-align: top;">내용</td>
      <td style="padding: 8px 0;">
        <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 14px; line-height: 1.5;">${description}</pre>
      </td>
    </tr>
  </table>
  <p style="margin-top: 24px; color: #555; font-size: 12px;">본 메일은 DX개발파트의 시스템에 의해 자동 발송되었습니다.</p>
</div>
`,
    })
  })


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
