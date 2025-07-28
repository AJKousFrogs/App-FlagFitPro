import React from 'react';

export const Progress = ({ value = 0, max = 100, className = '', ...props }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  return (
    <div className={`progress ${className}`} {...props}>
      <div 
        className="progress-bar" 
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export const ProgressBar = ({ value = 0, max = 100, className = '', ...props }) => {
  return <Progress value={value} max={max} className={className} {...props} />;
}; 