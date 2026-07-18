export interface ServiceTagProps {
  name: string;
}

export function ServiceTag({ name }: ServiceTagProps): JSX.Element {
  return (
    <span className="inline-flex items-center rounded border border-wire px-1.5 py-0.5 font-mono text-xs leading-none text-muted">
      {name}
    </span>
  );
}
