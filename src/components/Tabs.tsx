export interface TabItem<T extends string> {
  id: T;
  label: string;
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: TabItem<T>[]; value: T; onChange: (id: T) => void }) {
  return (
    <div className="it-tabs" role="tablist" aria-label="Разделы">
      {tabs.map((t) => (
        <button key={t.id} className="it-tab" role="tab" type="button" aria-selected={t.id === value} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
