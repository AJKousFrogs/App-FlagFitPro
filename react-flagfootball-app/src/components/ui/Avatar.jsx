import React from 'react';

export const Avatar = ({ children, className = '', size = 'medium', ...props }) => {
  const baseClass = 'avatar';
  const sizeClass = `avatar-${size}`;
  
  return (
    <div className={`${baseClass} ${sizeClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const AvatarImage = ({ src, alt, className = '', ...props }) => {
  return (
    <img 
      src={src} 
      alt={alt} 
      className={`avatar-image ${className}`} 
      {...props} 
    />
  );
};

export const AvatarFallback = ({ children, className = '', ...props }) => {
  return (
    <div className={`avatar-fallback ${className}`} {...props}>
      {children}
    </div>
  );
}; 