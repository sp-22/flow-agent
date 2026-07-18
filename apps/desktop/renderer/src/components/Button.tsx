import * as React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-high text-base border border-high hover:opacity-90',
  secondary: 'bg-transparent text-body border border-wire hover:border-wire-hover hover:text-heading',
  ghost: 'bg-transparent text-muted border border-transparent hover:bg-elevated hover:text-body',
  danger: 'bg-[var(--signal-bg)] text-signal border border-transparent hover:opacity-90',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
};

function joinClassNames(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(' ');
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: ButtonProps): JSX.Element {
  return (
    <button
      type={type}
      className={joinClassNames(
        'inline-flex items-center justify-center rounded-md font-body font-medium',
        'transition-colors duration-150 ease-[var(--ease)]',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wire-hover',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    />
  );
}
