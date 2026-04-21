import React from 'react';
import './Badge.css';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  status?: 'success' | 'warning' | 'error' | 'info' | 'offline' | 'default';
  pulsing?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = '',
  status = 'default',
  pulsing = false,
  ...props
}) => {
  const badgeClass = `badge badge--${status} ${className}`;
  
  return (
    <span className={badgeClass} {...props}>
      {pulsing && <span className={`badge__dot badge__dot--${status}`} />}
      {children}
    </span>
  );
};
