import React from 'react';
import { FiAlertTriangle, FiMap, FiActivity, FiTrendingUp } from 'react-icons/fi';

const StatItem = ({ icon, label, value, color = '#2563EB', subtext }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-pbi-border last:border-0">
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-pbi-muted">{label}</p>
      <p className="text-sm font-bold text-white">{value ?? '—'}</p>
      {subtext && <p className="text-xs text-pbi-muted">{subtext}</p>}
    </div>
  </div>
);

const StatisticsPanel = ({ stats, metadata }) => {
  if (!stats && !metadata) {
    return (
      <div className="glass-card-static p-4 rounded-xl">
        <p className="text-xs text-pbi-muted text-center py-4">No statistics available</p>
      </div>
    );
  }

  const riskStats    = stats?.risk_statistics    || {};
  const networkStats = stats?.network_statistics  || {};
  const accStats     = stats?.accident_statistics || {};

  const totalSegments = networkStats.total_edges   ?? metadata?.total_segments ?? '—';
  const totalAccidents = accStats.total_accidents  ?? metadata?.total_accidents ?? '—';
  const avgRisk        = riskStats.mean_risk != null
    ? `${riskStats.mean_risk.toFixed(1)}%`
    : '—';
  const highRiskCount  = riskStats.high_risk_count ?? '—';
  const mappedAcc      = accStats.mapped_accidents  ?? '—';
  const matchRate      = accStats.match_rate != null
    ? `${(accStats.match_rate * 100).toFixed(1)}%`
    : '—';

  return (
    <div className="glass-card-static p-4 rounded-xl">
      <h4 className="text-xs font-semibold text-pbi-muted uppercase tracking-wider mb-2 flex items-center gap-2">
        <FiActivity className="text-pbi-blue" />
        Network Statistics
      </h4>

      <StatItem
        icon={<FiMap />}
        label="Road Segments"
        value={typeof totalSegments === 'number' ? totalSegments.toLocaleString() : totalSegments}
        color="#2563EB"
      />
      <StatItem
        icon={<FiAlertTriangle />}
        label="Total Accidents"
        value={typeof totalAccidents === 'number' ? totalAccidents.toLocaleString() : totalAccidents}
        subtext={mappedAcc !== '—' ? `${mappedAcc} mapped (${matchRate})` : undefined}
        color="#EF4444"
      />
      <StatItem
        icon={<FiTrendingUp />}
        label="Average Risk Score"
        value={avgRisk}
        color="#F59E0B"
      />
      <StatItem
        icon={<FiAlertTriangle />}
        label="High Risk Segments"
        value={typeof highRiskCount === 'number' ? highRiskCount.toLocaleString() : highRiskCount}
        color="#EF4444"
        subtext="Risk ≥ 75%"
      />

      {/* Risk distribution bar */}
      {riskStats.high_risk_count != null && riskStats.medium_risk_count != null && riskStats.low_risk_count != null && (
        <div className="mt-3 pt-3 border-t border-pbi-border">
          <p className="text-xs text-pbi-muted mb-2">Risk Distribution</p>
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {(() => {
              const total = (riskStats.high_risk_count || 0) +
                            (riskStats.medium_risk_count || 0) +
                            (riskStats.low_risk_count || 0);
              if (total === 0) return null;
              const highPct   = (riskStats.high_risk_count   / total) * 100;
              const medPct    = (riskStats.medium_risk_count / total) * 100;
              const lowPct    = (riskStats.low_risk_count    / total) * 100;
              return (
                <>
                  <div className="bg-pbi-red    rounded-l-full h-full transition-all" style={{ width: `${highPct}%` }} title={`High: ${highPct.toFixed(1)}%`} />
                  <div className="bg-pbi-yellow h-full transition-all"                style={{ width: `${medPct}%` }}  title={`Medium: ${medPct.toFixed(1)}%`} />
                  <div className="bg-pbi-green  rounded-r-full h-full transition-all" style={{ width: `${lowPct}%` }}  title={`Low: ${lowPct.toFixed(1)}%`} />
                </>
              );
            })()}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-pbi-red">High</span>
            <span className="text-[10px] text-pbi-yellow">Medium</span>
            <span className="text-[10px] text-pbi-green">Low</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPanel;
