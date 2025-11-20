import React from 'react';

interface ProgressBarProps {
  progress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
        style={{ width: `${safeProgress}%` }}
      ></div>
    </div>
  );
};