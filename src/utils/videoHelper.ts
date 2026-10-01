export interface ParsedVideo {
  type: 'gdrive' | 'youtube' | 'vimeo' | 'loom' | 'cloudflare' | 'html5' | 'unknown';
  embedUrl: string;
  originalUrl: string;
  videoId?: string;
}

export const parseVideoUrl = (url: string): ParsedVideo => {
  if (!url) {
    return {
      type: 'unknown',
      embedUrl: '',
      originalUrl: ''
    };
  }

  const clean = url.trim();

  // 1. Google Drive matchers
  // Matches: drive.google.com/file/d/FILE_ID/..., drive.google.com/open?id=FILE_ID, drive.google.com/uc?id=FILE_ID, docs.google.com/file/d/FILE_ID
  const gDriveFileMatch = clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i) ||
                          clean.match(/docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i) ||
                          clean.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i);

  if (gDriveFileMatch && gDriveFileMatch[1]) {
    const fileId = gDriveFileMatch[1];
    return {
      type: 'gdrive',
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      originalUrl: clean,
      videoId: fileId
    };
  }

  // 2. YouTube matchers
  const ytMatch = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`,
      originalUrl: clean,
      videoId
    };
  }

  // 3. Vimeo matchers
  const vimeoMatch = clean.match(/(?:vimeo\.com\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=0`,
      originalUrl: clean,
      videoId
    };
  }

  // 4. Loom matchers
  const loomMatch = clean.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9_-]+)/i);
  if (loomMatch && loomMatch[1]) {
    const videoId = loomMatch[1];
    return {
      type: 'loom',
      embedUrl: `https://www.loom.com/embed/${videoId}`,
      originalUrl: clean,
      videoId
    };
  }

  // 5. Cloudflare Stream
  if (clean.includes('videodelivery.net') || clean.includes('cloudflarestream.com')) {
    const cfMatch = clean.match(/(?:videodelivery\.net|cloudflarestream\.com)\/([a-zA-Z0-9]+)/i);
    const videoId = cfMatch ? cfMatch[1] : '';
    return {
      type: 'cloudflare',
      embedUrl: clean.includes('/manifest/') ? clean : `https://iframe.videodelivery.net/${videoId}`,
      originalUrl: clean,
      videoId
    };
  }

  // 6. Direct MP4 / WebM / Blob / Google Storage / HTML5 video
  if (clean.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || clean.includes('commondatastorage.googleapis.com') || clean.startsWith('blob:')) {
    return {
      type: 'html5',
      embedUrl: clean,
      originalUrl: clean
    };
  }

  // Fallback to HTML5 if it looks like a direct URL or unknown
  return {
    type: 'html5',
    embedUrl: clean,
    originalUrl: clean
  };
};

export const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const parseTimeStringToSeconds = (timeStr: string): number => {
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.length === 2) {
    return (parts[0] * 60) + (parts[1] || 0);
  }
  if (parts.length === 3) {
    return (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
  }
  return 0;
};
