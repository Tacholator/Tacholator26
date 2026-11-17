// Single source of truth for how a person's name is shown across the app.
// The account record's built-in full_name can't be changed, so the profile
// name (firstName / lastName) always wins when it is set.
export function getUserDisplayName(user, fallback = 'User') {
  if (!user) return fallback;
  const profileName = [user.firstName, user.lastName]
    .filter((part) => part && String(part).trim())
    .join(' ')
    .trim();
  if (profileName) return profileName;
  if (user.full_name && user.full_name.trim()) return user.full_name.trim();
  return user.email || fallback;
}

export function getUserFirstName(user, fallback = 'there') {
  const name = getUserDisplayName(user, '');
  return name ? name.split(' ')[0] : fallback;
}