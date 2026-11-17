// Single source of truth for resolving a person's name in server-side code.
// The account record's built-in full_name can't be changed, so the profile
// name (firstName / lastName) always wins when it is set.
export function resolveUserName(user: any, fallback = ''): string {
  if (!user) return fallback;
  const profileName = [user.firstName, user.lastName]
    .filter((part: any) => part && String(part).trim())
    .join(' ')
    .trim();
  if (profileName) return profileName;
  if (user.full_name && String(user.full_name).trim()) return String(user.full_name).trim();
  return user.email || fallback;
}