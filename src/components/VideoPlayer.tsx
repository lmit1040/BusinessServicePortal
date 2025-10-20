import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, X, Loader2 } from 'lucide-react';
import { parseVideoUrl, type VideoInfo } from '../lib/video-utils';

interface VideoPlayerProps {
  url: string;
  title?: string;
  autoPlay?: boolean;
  className?: string;
  showControls?: boolean;
  onClose?: () => void;
}

export function VideoPlayer({
  url,
  title,
  autoPlay = false,
  className = '',
  showControls = true,
  onClose
}: VideoPlayerProps) {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const info = parseVideoUrl(url);
    setVideoInfo(info);

    if (info.type === 'unknown') {
      setError('Unsupported video format');
      setIsLoading(false);
    } else {
      setError(null);
    }
  }, [url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadedData = () => {
      console.log('Video loaded');
      setIsLoading(false);
    };
    const handleCanPlay = () => {
      console.log('Video can play');
      setIsLoading(false);
    };
    const handleError = () => {
      setError('Failed to load video');
      setIsLoading(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!videoInfo) {
    return (
      <div className={`flex items-center justify-center bg-slate-900 ${className}`}>
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-slate-900 text-white p-8 ${className}`}>
        <div className="text-center">
          <p className="text-lg mb-2">Unable to load video</p>
          <p className="text-sm text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (videoInfo.type === 'youtube' || videoInfo.type === 'vimeo') {
    return (
      <div className={`relative bg-slate-900 ${className}`}>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <iframe
          src={videoInfo.embedUrl}
          title={title || 'Video player'}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>
    );
  }

  if (videoInfo.type === 'direct') {
    return (
      <div className={`relative bg-slate-900 group ${className}`}>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <video
          ref={videoRef}
          src={videoInfo.url}
          className="w-full h-full object-contain relative z-10"
          autoPlay={autoPlay}
          onClick={togglePlay}
          playsInline
          preload="metadata"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-0">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
        {showControls && !isLoading && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </button>

              <div className="flex-1 flex items-center gap-2">
                <span className="text-xs text-white font-medium">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 bg-white bg-opacity-30 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) 100%)`
                  }}
                />
                <span className="text-xs text-white font-medium">{formatTime(duration)}</span>
              </div>

              <button
                onClick={toggleMute}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <Maximize className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
