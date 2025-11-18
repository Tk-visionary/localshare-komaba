import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'orange' | 'white';
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'lg',
  color = 'orange',
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4',
  };

  const colorClasses = {
    orange: 'border-komaba-orange',
    white: 'border-white',
  };

  const containerClass = fullScreen
    ? 'flex justify-center items-center h-screen'
    : 'flex justify-center items-center h-64';

  return (
    <div className={containerClass}>
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} border-dashed rounded-full animate-spin`}
      />
    </div>
  );
};

export default LoadingSpinner;
