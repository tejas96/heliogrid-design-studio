import type { ReactNode } from 'react';

export function MmsField({ id, label, value, min = 0, max = 10000, step = .1, onChange }: { id: string; label: string; value?: number; min?: number; max?: number; step?: number; onChange: (v: number | undefined) => void }) {
  return <label className="mms-field" htmlFor={id}><span>{label}</span><input id={id} data-testid={id} aria-label={label} type="number" min={min} max={max} step={step} value={value ?? ''} placeholder="Not supplied" onChange={e => { if (!e.target.value) { onChange(undefined); return; } const v = Number(e.target.value); if (Number.isFinite(v) && v >= min && v <= max) onChange(v); }} /></label>;
}
export function MmsSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <details className="mms-section"><summary data-testid={`${id}-toggle`}>{title}</summary><div className="mms-fields">{children}</div></details>;
}