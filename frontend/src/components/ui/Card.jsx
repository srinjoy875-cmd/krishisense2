import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Card({ children, className, title, ...props }) {
  return (
    <div
      className={twMerge("bg-white rounded-xl shadow-soft border border-border p-6", className)}
      {...props}
    >
      {title && <h3 className="text-lg font-semibold text-text-primary mb-4">{title}</h3>}
      {children}
    </div>
  );
}
