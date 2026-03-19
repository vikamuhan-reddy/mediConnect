import React from 'react';

const Skeleton = ({ className = '', variant = 'rectangular' }) => {
  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-2xl',
  };

  return (
    <div 
      className={`bg-slate-200 animate-pulse ${variantClasses[variant]} ${className}`}
    />
  );
};

export default Skeleton;
