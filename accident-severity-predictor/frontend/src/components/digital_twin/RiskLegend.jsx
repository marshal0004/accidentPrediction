import React from 'react';

const RiskLegend = ({ compact = false }) => {
  const levels = [
    { label: 'High Risk',   color: '#EF4444', range: '≥75%', icon: '🔴' },
    { label: 'Medium Risk', color: '#F59E0B', range: '40-75%', icon: '🟡' },
    { label: 'Low Risk',    color: '#10B981', range: '<40%', icon: '🟢' },
    { label: 'No Data',     color: '#4B5563', range: '—', icon: '⚫' },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        {levels.map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: l.color }}
            />
            <span className="text-xs text-pbi-text2">{l.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="glass-card-static p-4 rounded-xl">
      <h4 className="text-xs font-semibold text-pbi-muted uppercase tracking-wider mb-3">
        Risk Legend
      </h4>
      <div className="space-y-2">
        {levels.map((l) => (
          <div key={l.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-2 rounded-sm flex-shrink-0"
                style={{ backgroundColor: l.color }}
              />
              <span className="text-xs text-white">{l.label}</span>
            </div>
            <span className="text-xs text-pbi-muted font-mono">{l.range}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-pbi-border">
        <p className="text-xs text-pbi-muted">
          Risk = probability of Fatal or Grievous outcome
        </p>
      </div>
    </div>
  );
};

export default RiskLegend;
