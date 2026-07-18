import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { useTheme, type Theme } from '../store/theme.store';

const DARK_THEME_VARIABLES = {
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
};

const LIGHT_THEME_VARIABLES = {
  primaryColor: '#f0f0f3',
  primaryTextColor: '#1d1d22',
  primaryBorderColor: '#bebec8',
  lineColor: '#bebec8',
  secondaryColor: '#e4e4e9',
  tertiaryColor: '#f9f9fb',
  background: '#f0f0f3',
  mainBkg: '#e4e4e9',
  nodeBorder: '#bebec8',
  clusterBkg: '#f0f0f3',
  titleColor: '#1d1d22',
  edgeLabelBackground: '#f0f0f3',
  fontFamily: 'IBM Plex Mono',
};

// Leading `%%{init: ... }%%` directives embedded in mock chart strings hardcode
// a dark theme, which would otherwise fight with the live theme applied below.
const INIT_DIRECTIVE_RE = /^%%\{init[\s\S]*?%%/;

function stripInitDirective(chart: string): string {
  return chart.replace(INIT_DIRECTIVE_RE, '').replace(/^\s*\n/, '');
}

// ThemeProvider isn't mounted in every host of this component (e.g. this
// component's standalone unit tests). Reading the hook defensively lets
// diagrams default to the dark palette instead of crashing the render.
function useOptionalTheme(): Theme {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useTheme().theme;
  } catch {
    return 'dark';
  }
}

export function Mermaid(props: { chart: string }): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`);
  const theme = useOptionalTheme();

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: theme === 'light' ? LIGHT_THEME_VARIABLES : DARK_THEME_VARIABLES,
    });

    let cancelled = false;
    const chart = stripInitDirective(props.chart);

    mermaid
      .render(idRef.current, chart)
      .then(({ svg }) => {
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
        }
      })
      .catch(() => {
        // Rendering can fail on a malformed chart or in a headless/jsdom
        // environment lacking SVG measurement (getBBox). Degrade gracefully
        // rather than throwing an unhandled rejection.
        if (!cancelled && ref.current) {
          ref.current.textContent = 'Unable to render diagram.';
        }
      });

    return () => {
      cancelled = true;
    };
  }, [props.chart, theme]);

  return <div ref={ref} className="mermaid-container flex justify-center" />;
}
