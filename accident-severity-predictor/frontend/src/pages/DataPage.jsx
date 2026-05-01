import React, { useState, useEffect } from 'react';
import { FiDatabase, FiFolder, FiFileText } from 'react-icons/fi';
import { api } from '../api/apiClient';
import ChartTile from '../components/common/ChartTile';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatNumber } from '../utils/formatters';

const DataPage = () => {
  const [datasetsInfo, setDatasetsInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 15;

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await api.datasetsInfo();
        const ds = res.data.datasets || [];
        setDatasetsInfo(ds);
        if (ds.length > 0) {
          const first = ds[0];
          setSelectedKey(first.type === 'delhi' ? first.directory : 'primary');
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchInfo();
  }, []);

  useEffect(() => {
    if (!selectedKey) return;
    const fetchPreview = async () => {
      setPreviewLoading(true);
      try {
        const res = await api.dataPreview(selectedKey, page, perPage);
        setPreviewData(res.data);
      } catch (err) { console.error(err); }
      finally { setPreviewLoading(false); }
    };
    fetchPreview();
  }, [selectedKey, page]);

  if (loading) return <LoadingSpinner text="Loading datasets..." />;

  const standardSets = datasetsInfo.filter(d => d.type !== 'delhi');
  const delhiSets = datasetsInfo.filter(d => d.type === 'delhi');

  return (
    <div className="space-y-6">
      {/* Standard Datasets */}
      {standardSets.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <FiDatabase className="text-pbi-blue" /> National Datasets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {standardSets.map((ds, i) => {
              const key = i === 0 ? 'primary' : 'secondary';
              return (
                <div key={i}
                  className={`glass-card p-5 cursor-pointer transition-all ${selectedKey === key ? 'ring-2 ring-pbi-blue' : ''}`}
                  onClick={() => { setSelectedKey(key); setPage(1); }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 bg-pbi-blue/20 rounded-lg flex items-center justify-center">
                      <FiDatabase className="text-pbi-blue" />
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full
                      ${ds.status === 'loaded' ? 'bg-pbi-green/10 text-pbi-green' : 'bg-pbi-red/10 text-pbi-red'}`}>
                      {ds.status === 'loaded' ? '✓ Loaded' : ds.status === 'found' ? '● Found' : '✗ Missing'}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{ds.name}</h3>
                  <div className="space-y-0.5 text-xs text-pbi-text2">
                    <p>Records: {formatNumber(ds.records)}</p>
                    <p>Features: {ds.features}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delhi Datasets */}
      {delhiSets.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <FiFolder className="text-pbi-yellow" /> Delhi Accident Datasets ({delhiSets.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {delhiSets.map((ds, i) => (
              <div key={i}
                className={`glass-card p-4 cursor-pointer transition-all hover:bg-white/[0.03]
                  ${selectedKey === ds.directory ? 'ring-2 ring-pbi-yellow' : ''}`}
                onClick={() => { setSelectedKey(ds.directory); setPage(1); }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 bg-pbi-yellow/20 rounded-lg flex items-center justify-center">
                    <FiFileText className="text-pbi-yellow text-sm" />
                  </div>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-pbi-green/10 text-pbi-green">
                    ✓ Ready
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-white mb-1 leading-tight">{ds.name}</h3>
                <div className="text-[11px] text-pbi-text2 space-y-0.5">
                  <p>Rows: {formatNumber(ds.records)}</p>
                  <p>CSVs: {ds.csv_count}</p>
                </div>
                {ds.csv_files && ds.csv_files.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {ds.csv_files.slice(0, 3).map((f, j) => (
                      <span key={j} className="text-[9px] bg-pbi-bg2 px-1.5 py-0.5 rounded border border-pbi-border text-pbi-muted truncate max-w-[120px]">
                        {f}
                      </span>
                    ))}
                    {ds.csv_files.length > 3 && (
                      <span className="text-[9px] text-pbi-muted">+{ds.csv_files.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Preview */}
      <ChartTile title="Data Preview" subtitle={`Dataset: ${selectedKey} — Page ${page}`}>
        {previewLoading ? (
          <LoadingSpinner size="sm" text="Loading..." />
        ) : previewData ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-pbi-border">
                    {previewData.columns?.slice(0, 10).map((col) => (
                      <th key={col} className="px-2 py-1.5 text-left text-pbi-muted font-medium whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-pbi-border/30">
                  {previewData.records?.map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      {previewData.columns?.slice(0, 10).map((col) => (
                        <td key={col} className="px-2 py-1.5 text-pbi-text2 whitespace-nowrap max-w-[120px] truncate">
                          {String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-pbi-border">
              <span className="text-xs text-pbi-muted">{formatNumber(previewData.total_records)} records</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1 rounded text-pbi-muted hover:text-white disabled:opacity-30">◀</button>
                <span className="text-xs text-pbi-text2">{page}/{previewData.total_pages || 1}</span>
                <button onClick={() => setPage(p => Math.min(previewData.total_pages || 1, p + 1))} disabled={page >= (previewData.total_pages || 1)}
                  className="p-1 rounded text-pbi-muted hover:text-white disabled:opacity-30">▶</button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-pbi-muted text-sm">Select a dataset above</p>
        )}
      </ChartTile>
    </div>
  );
};

export default DataPage;
