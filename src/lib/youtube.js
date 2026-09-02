// Extracts an 11-character YouTube video ID from common URL formats.
export function extractYouTubeId(url) {
  if (!url) return null;
  const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
  const match = String(url).match(regex);
  return match ? match[1] : null;
}

// Returns a YouTube thumbnail URL for a given video URL or ID.
export function youtubeThumbnail(url) {
  const id = url && url.length === 11 && /^[A-Za-z0-9_-]{11}$/.test(url) ? url : extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}