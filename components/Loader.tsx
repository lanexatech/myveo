import React from 'react';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-center p-4">
      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
      <p className="text-lg font-semibold text-indigo-800">{message}</p>
      <p className="text-sm text-indigo-600 mt-2">Video generation is in progress. Please don't close this window.</p>
    </div>
  );
};

export default Loader;
