import React from 'react';
import './GlassCard.css';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'primary',
  hoverEffect = false,
  ...props
}) => {
  const cardClass = `glass-card glass-card--${variant} ${hoverEffect ? 'glass-card--hoverable' : ''} ${className}`;
  
  return (
    <div className={cardClass} {...props}>
      <div className="glass-card__content">
        {children}
      </div>
    </div>
  );
};


