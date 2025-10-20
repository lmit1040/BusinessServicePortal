import { useState, useEffect } from 'react';
import { Image, Video, ExternalLink, Trash2, Loader2, RefreshCw, Play } from 'lucide-react';
import { listFilesInSupabase, deleteFileFromSupabase } from '../lib/supabase-storage';
import { VideoModal } from './VideoModal';

export function MediaManager() {
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const loadFiles = async () => {
    setLoading(true);
    setError('');

    try {
      const [imageFiles, videoFiles] = await Promise.all([
        listFilesInSupabase('product-images'),
        listFilesInSupabase('product-videos'),
      ]);

      setImages(imageFiles);
      setVideos(videoFiles);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load files';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleDelete = async (fileUrl: string, type: 'image' | 'video') => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    setDeleting(fileUrl);
    setError('');

    try {
      const bucket = type === 'image' ? 'product-images' : 'product-videos';
      await deleteFileFromSupabase(fileUrl, bucket);

      if (type === 'image') {
        setImages(images.filter((url) => url !== fileUrl));
      } else {
        setVideos(videos.filter((url) => url !== fileUrl));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      setError(errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  const getFileName = (url: string) => {
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    return decodeURIComponent(fileName).split('-').slice(1).join('-');
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <p className="text-slate-600">Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Media Files</h2>
        <button
          onClick={loadFiles}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Image className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Images ({images.length})</h3>
        </div>

        {images.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
            <p className="text-slate-600">No images uploaded yet</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {images.map((imageUrl) => (
              <div key={imageUrl} className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-slate-100 overflow-hidden">
                  <img
                    src={imageUrl}
                    alt="Product"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-slate-900 font-medium truncate mb-2">
                    {getFileName(imageUrl)}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(imageUrl)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Copy URL
                    </button>
                    <button
                      onClick={() => handleDelete(imageUrl, 'image')}
                      disabled={deleting === imageUrl}
                      className="px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors disabled:opacity-50"
                    >
                      {deleting === imageUrl ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Video className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Videos ({videos.length})</h3>
        </div>

        {videos.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
            <p className="text-slate-600">No videos uploaded yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {videos.map((videoUrl) => (
              <div key={videoUrl} className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 p-4">
                  <button
                    onClick={() => setPlayingVideo(videoUrl)}
                    className="relative flex-shrink-0 w-32 h-20 bg-slate-900 rounded-lg overflow-hidden group cursor-pointer"
                  >
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-all">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                    <video src={videoUrl} className="w-full h-full object-cover" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 font-medium truncate mb-1">
                      {getFileName(videoUrl)}
                    </p>
                    <p className="text-xs text-slate-500 truncate mb-3">{videoUrl}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPlayingVideo(videoUrl)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        Play
                      </button>
                      <button
                        onClick={() => copyToClipboard(videoUrl)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded border border-slate-200 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Copy URL
                      </button>
                      <button
                        onClick={() => handleDelete(videoUrl, 'video')}
                        disabled={deleting === videoUrl}
                        className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors disabled:opacity-50"
                      >
                        {deleting === videoUrl ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {playingVideo && (
        <VideoModal
          url={playingVideo}
          title={getFileName(playingVideo)}
          onClose={() => setPlayingVideo(null)}
        />
      )}
    </div>
  );
}
