import {getMembers, getCalendar} from "./src/api/groupware";
//
// getMembers().then(members => {
//   return Promise.all(members.map(async (member) => {
//     if (!member?.id) return {};
//     const calendar = await getCalendar(member.id);
//     return {
//       calendarId: calendar,
//       ...member,
//     }
//   }))
// });//.then(console.log);
