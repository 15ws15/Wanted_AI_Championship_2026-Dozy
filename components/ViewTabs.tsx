'use client';

export type View = 'list' | 'calendar' | 'history';

const TABS: [View, string][] = [
  ['list', '오늘 할 일'],
  ['calendar', '달력'],
  ['history', '지난 기록'],
];

export default function ViewTabs({
  view,
  onChange,
}: {
  view: View;
  onChange: (v: View) => void;
}) {
  return (
    <nav className="mt-14 flex border-t border-line pt-2 text-[13px]">
      {TABS.map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          aria-current={view === key ? 'page' : undefined}
          className={`min-h-11 flex-1 rounded-lg transition-colors ${
            view === key ? 'font-medium text-accent' : 'text-mute hover:text-ink'
          }`}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
