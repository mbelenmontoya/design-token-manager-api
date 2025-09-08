export function isPlatformAdminUsername(username) {
  const list = (process.env.PLATFORM_ADMINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return !!username && list.includes(username);
}

