import { NavLink } from 'react-router-dom';

interface TabDef {
  label: string;
  to: string;
}

const TABS: TabDef[] = [
  { label: 'Record', to: '/record' },
  { label: 'Workflows', to: '/workflows' },
  { label: 'Executions', to: '/executions' },
];

function joinClassNames(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(' ');
}

export function SegmentedTabs(): JSX.Element {
  return (
    <div
      role="tablist"
      className="inline-flex items-center gap-1"
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          role="tab"
          className={({ isActive }) =>
            joinClassNames(
              'rounded-sm px-3 py-1 font-body text-sm transition-colors duration-150 ease-[var(--ease)]',
              isActive ? 'bg-surface text-heading' : 'text-muted hover:text-body'
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
