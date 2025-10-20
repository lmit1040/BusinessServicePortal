export type VideoType = 'youtube' | 'vimeo' | 'direct' | 'unknown';

export interface VideoInfo {
  type: VideoType;
  url: string;
  embedUrl?: string;
  videoId?: string;
}

export const parseVideoUrl = (url: string): VideoInfo => {
  if (!url || typeof url !== 'string') {
    return { type: 'unknown', url: '' };
  }

  const cleanUrl = url.trim();

  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const youtubeMatch = cleanUrl.match(youtubeRegex);
  if (youtubeMatch) {
    return {
      type: 'youtube',
      url: cleanUrl,
      videoId: youtubeMatch[1],
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1`,
    };
  }

  const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:|\/\?)/;
  const vimeoMatch = cleanUrl.match(vimeoRegex);
  if (vimeoMatch) {
    return {
      type: 'vimeo',
      url: cleanUrl,
      videoId: vimeoMatch[1],
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  }

  const videoExtensions = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
  if (videoExtensions.test(cleanUrl)) {
    return {
      type: 'direct',
      url: cleanUrl,
    };
  }

  return { type: 'unknown', url: cleanUrl };
};

export const getVideoThumbnail = (videoInfo: VideoInfo): string | null => {
  if (videoInfo.type === 'youtube' && videoInfo.videoId) {
    return `https://img.youtube.com/vi/${videoInfo.videoId}/maxresdefault.jpg`;
  }

  if (videoInfo.type === 'vimeo' && videoInfo.videoId) {
    return null;
  }

  return null;
};

export const isValidVideoUrl = (url: string): boolean => {
  const videoInfo = parseVideoUrl(url);
  return videoInfo.type !== 'unknown';
};
