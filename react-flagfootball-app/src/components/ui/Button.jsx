import React from 'react';

export const Button = ({ children, className = '', variant = 'default', ...props }) => {
  const baseClass = 'button';
  const variantClass = `button-${variant}`;
  
  return (
    <button className={`${baseClass} ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
}; 