import { VideoPlayer } from './VideoPlayer';

interface VideoModalProps {
  url: string;
  title?: string;
  onClose: () => void;
}

export function VideoModal({ url, title, onClose }: VideoModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl"
        style={{ height: 'calc(100vh - 8rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <VideoPlayer
          url={url}
          title={title}
          autoPlay={true}
          className="w-full h-full rounded-lg overflow-hidden"
          showControls={true}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
