import * as React from 'react';

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

function joinClassNames(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(' ');
}

export function Card({ className, ...rest }: CardProps): JSX.Element {
  return (
    <div
      className={joinClassNames(
        'bg-surface border border-wire rounded-lg transition-colors duration-150 ease-[var(--ease)]',
        'hover:border-wire-hover',
        className
      )}
      {...rest}
    />
  );
}
