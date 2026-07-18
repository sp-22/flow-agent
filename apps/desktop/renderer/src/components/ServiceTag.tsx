import { ServiceLogo, isServiceName } from './ServiceLogo';

export interface ServiceTagProps {
  name: string;
}

export function ServiceTag({ name }: ServiceTagProps): JSX.Element {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-wire px-1.5 py-0.5 font-mono text-xs leading-none text-muted">
      {isServiceName(name) ? <ServiceLogo name={name} size={12} /> : null}
      {name}
    </span>
  );
}
