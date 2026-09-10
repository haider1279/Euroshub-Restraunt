import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-lg border border-bistro-border shadow-soft p-5 transition-bistro ${
        hoverEffect ? 'hover:shadow-card hover:border-terracotta-200' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
