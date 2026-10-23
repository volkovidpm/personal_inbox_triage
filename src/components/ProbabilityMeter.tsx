import { formatPercent } from "../lib/format";

/** Показание Jev: вероятность на шкале с порогами 40% и 70%. */
export function ProbabilityMeter({ label, p }: { label: string; p: number }) {
  const tone = p < 0.4 ? " it-meter--low" : p <= 0.7 ? " it-meter--mid" : "";
  return (
    <div className={`it-meter${tone}`} style={{ "--p": p } as React.CSSProperties}>
      <span className="it-meter__label">{label}</span>
      <span className="it-meter__value">{formatPercent(p)}</span>
      <div className="it-meter__track" aria-hidden="true">
        <div className="it-meter__fill" />
        <span className="it-meter__tick" style={{ "--at": 0.4 } as React.CSSProperties} data-label="40%" />
        <span className="it-meter__tick" style={{ "--at": 0.7 } as React.CSSProperties} data-label="70%" />
      </div>
    </div>
  );
}
