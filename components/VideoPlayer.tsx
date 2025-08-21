import React from 'react';
import DownloadIcon from './icons/DownloadIcon';

interface VideoPlayerProps {
  videoUrl: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl }) => {
  return (
    <div className="w-full flex flex-col items-center gap-4">
      <video
        src={videoUrl}
        controls
        className="w-full rounded-lg shadow-lg aspect-video"
        autoPlay
        loop
      >
        Your browser does not support the video tag.
      </video>
      <a
        href={videoUrl}
        download="generated-video.mp4"
        className="mt-4 inline-flex items-center gap-2 bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-600 transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <DownloadIcon className="w-5 h-5" />
        Download Video
      </a>
    </div>
  );
};

export default VideoPlayer;
