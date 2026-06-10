import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50',
  ghost: 'bg-transparent text-zinc-300 hover:bg-zinc-700',
  danger: 'bg-transparent text-red-400 hover:bg-red-900/40',
};

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${variantClasses[variant]} ${className}`}
    />
  );
}
