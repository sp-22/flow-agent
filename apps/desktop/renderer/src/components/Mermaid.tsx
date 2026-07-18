import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

let initialized = false;

function ensureInitialized(): void {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
      primaryColor: '#131316',
      primaryTextColor: '#ececef',
      primaryBorderColor: '#33333d',
      lineColor: '#5f5f70',
      secondaryColor: '#1c1c21',
      tertiaryColor: '#09090b',
      background: '#131316',
      mainBkg: '#1c1c21',
      nodeBorder: '#33333d',
      clusterBkg: '#131316',
      titleColor: '#ececef',
      edgeLabelBackground: '#131316',
      fontFamily: 'IBM Plex Mono',
    },
  });
  initialized = true;
}

export function Mermaid(props: { chart: string }): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    ensureInitialized();
    let cancelled = false;

    mermaid.render(idRef.current, props.chart).then(({ svg }) => {
      if (!cancelled && ref.current) {
        ref.current.innerHTML = svg;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [props.chart]);

  return <div ref={ref} className="mermaid-container flex justify-center" />;
}
