import { CookieJar } from 'tough-cookie'
const jar = new CookieJar()

const DEFAULT_HEADER = {
  'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
};


let cookie = '';

const login = async () => {
  const url = 'https://gw.aegisep.com/api/login';
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://gw.aegisep.com/login',
      ...DEFAULT_HEADER,
    },
    body: JSON.stringify({
      username: process.env.REPORTERID,
      password: process.env.REPORTERPW,
      captcha: '',
      returnUrl: '',
    }),
  }).then((res) => {
    res.headers.getSetCookie().map(c => jar.setCookie(c, 'https://gw.aegisep.com'));
  }).catch((res) => {
    console.log(res)
    return;
  });
}

const getDepartmentMembers = async (deptId: string|number) => {
  const cookieHeader = await jar.getCookieString('https://gw.aegisep.com')
  return fetch(`https://gw.aegisep.com/api/organization/user/descendant?page=0&offset=300&nodeType=department&deptid=${deptId}`, {
    headers: {
      ...DEFAULT_HEADER,
      Cookie: cookieHeader,
    },
  }).then(res => res.json()).then(res => res.data);
}

export const getMembers = async (depts: Array<string|number> = [111, 159]) => {
  if (!cookie) await login();
  return (await Promise.all(depts.map(getDepartmentMembers))).flat(2).map(item => ({
    id: item.id,
    loginId: item.loginId,
    email: item.email,
    name: item.name,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

export const getCalendar = async (memberId: string|number) => {
  const cookieHeader = await jar.getCookieString('https://gw.aegisep.com')
  return fetch(`https://gw.aegisep.com/api/calendar/user/${memberId}/calendar`, {
    headers: {
      ...DEFAULT_HEADER,
      Cookie: cookieHeader,
    },
  })
    .then(res => res.json())
    .then(res => (res.data.find(d=> d.name === '내 일정') || res.data[0]).id)
    .then(cid => fetch(`https://gw.aegisep.com/api/calendar/user/${memberId}/calendar`, {
      headers: {
        ...DEFAULT_HEADER,
        Cookie: cookieHeader,
      },
    })
      .then(res => res.json()));
}
