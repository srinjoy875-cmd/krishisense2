import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Input({ label, className, error, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}
      <input
        className={twMerge(
          "px-4 py-2 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
          error && "border-red-500 focus:ring-red-200 focus:border-red-500",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
