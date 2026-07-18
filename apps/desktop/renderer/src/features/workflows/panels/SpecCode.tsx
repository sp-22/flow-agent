import { useState } from 'react';

type Tab = 'skill.py' | 'manifest.yaml';

const TABS: Tab[] = ['skill.py', 'manifest.yaml'];

export function SpecCode(props: { skillPy: string; manifestYaml: string }): JSX.Element {
  const [tab, setTab] = useState<Tab>('skill.py');
  const content = tab === 'skill.py' ? props.skillPy : props.manifestYaml;

  return (
    <div className="flex flex-col gap-2">
      <div role="tablist" className="flex gap-1 border-b border-wire">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            className={[
              'px-3 py-1.5 font-mono text-xs border-b transition-colors duration-150 ease-[var(--ease)]',
              tab === name
                ? 'text-high border-high'
                : 'text-muted border-transparent hover:text-body',
            ].join(' ')}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <pre className="mono bg-surface rounded-md p-3 text-sm text-body overflow-x-auto whitespace-pre-wrap">
        {content}
      </pre>
    </div>
  );
}
