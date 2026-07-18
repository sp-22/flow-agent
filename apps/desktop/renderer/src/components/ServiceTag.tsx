export interface ServiceTagProps {
  name: string;
}

const SERVICE_DOMAINS: Record<string, string> = {
  github: 'github.com',
  sentry: 'sentry.io',
  slack: 'slack.com',
  notion: 'notion.so',
  gmail: 'mail.google.com',
  web: 'www.google.com',
};

function logoUrl(domain: string): string {
  return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=64&url=https://${domain}`;
}

export function ServiceTag({ name }: ServiceTagProps): JSX.Element {
  const domain = SERVICE_DOMAINS[name.trim().toLowerCase()];

  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center"
      title={name}
    >
      {domain ? (
        <img
          src={logoUrl(domain)}
          alt={name}
          width={16}
          height={16}
          className="h-4 w-4 rounded-sm"
          loading="lazy"
        />
      ) : (
        <span className="font-mono text-[10px] leading-none text-muted" aria-label={name}>
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
}
