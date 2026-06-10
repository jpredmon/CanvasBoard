import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

export function Input({ label, id, error, className = '', ...props }: Props) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-zinc-300">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={errorId}
        aria-invalid={!!error}
        className={`rounded-md border bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:ring-2 focus:ring-indigo-500 ${error ? 'border-red-500' : 'border-zinc-600'} ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
