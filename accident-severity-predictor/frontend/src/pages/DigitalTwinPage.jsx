import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Popup, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import {
  FiMap, FiRefreshCw, FiAlertTriangle,
  FiActivity, FiInfo, FiFilter
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { api } from '../api/apiClient';
import { CITY_CENTERS } from '../utils/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';
import KPICard from '../components/common/KPICard';
import CitySelector from '../components/digital_twin/CitySelector';
import StatisticsPanel from '../components/digital_twin/StatisticsPanel';
import TopDangerousList from '../components/digital_twin/TopDangerousList';
import SegmentDetailPanel from '../components/digital_twin/SegmentDetailPanel';
import RiskLegend from '../components/digital_twin/RiskLegend';

// ─── Performance cap ───────────────────────────────────────────────────────────
const MAX_MAP_SEGMENTS = 500;

// ─── Use backend color directly, fallback to calculated ───────────────────────
const getSegmentColor = (seg) => {
  // Use risk_score for colors visible on LIGHT map background
  const score = seg.risk_score ?? 0;
  if (score >= 60) return '#DC2626';  // red - high risk
  if (score >= 40) return '#EA580C';  // orange - moderate
  if (score >= 20) return '#D97706';  // amber - low-moderate
  if (score > 0)   return '#16A34A';  // green - low risk
  return '#6B7280';                   // gray - no data
};

const getSegmentWeight = (seg) => {
  // Backend provides weight field directly - use it!
  if (seg.weight) return Math.min(seg.weight, 5);
  const score = seg.risk_score ?? 0;
  if (score >= 80) return 5;
  if (score >= 60) return 4;
  if (score >= 40) return 3;
  return 2;
};

// ─── Map recenter ──────────────────────────────────────────────────────────────
const MapRecenter = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && map) {
      try { map.setView([center.lat, center.lng], zoom || 12); }
      catch (e) { /* ignore */ }
    }
  }, [center, zoom, map]);
  return null;
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const DigitalTwinPage = () => {
  const [cities,           setCities]           = useState([]);
  const [selectedCity,     setSelectedCity]     = useState(null);
  const [initializingCity, setInitializingCity] = useState(null);
  const [segments,         setSegments]         = useState([]);
  const [topDangerous,     setTopDangerous]     = useState([]);
  const [stats,            setStats]            = useState(null);
  const [metadata,         setMetadata]         = useState(null);
  const [selectedSegment,  setSelectedSegment]  = useState(null);
  const [detailSegment,    setDetailSegment]    = useState(null);
  const [loading,          setLoading]          = useState(false);
  const [mapLoading,       setMapLoading]       = useState(false);
  // Default filter: show HIGH risk only (60+) for performance
  const [riskFilter,       setRiskFilter]       = useState(60);
  const [sidebarTab,       setSidebarTab]       = useState('stats');
  const [mapKey,           setMapKey]           = useState('map-initial');
  const [mapReady,         setMapReady]         = useState(false);

  // ── load cities ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await api.twinCities();
        const cityList = res.data?.cities || [];
        setCities(cityList);
        const ready = cityList.find((c) => c.status === 'ready');
        if (ready) {
          setSelectedCity(ready.key);
          loadCityData(ready.key);
        }
      } catch (err) {
        toast.error('Failed to load cities');
        console.error(err);
      }
    };
    fetchCities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── load city data ───────────────────────────────────────────────────────────
  const loadCityData = useCallback(async (cityKey) => {
    if (!cityKey) return;
    setMapLoading(true);
    setMapReady(false);
    setSegments([]);
    setTopDangerous([]);
    setStats(null);
    setMetadata(null);
    setDetailSegment(null);
    setSelectedSegment(null);

    try {
      const [heatmapRes, statsRes, topRes] = await Promise.allSettled([
        api.twinHeatmap(cityKey, 'segments', 0),
        api.twinStats(cityKey),
        api.twinTopDangerous(cityKey, 15, 0),
      ]);

      if (heatmapRes.status === 'fulfilled') {
        const allSegs = heatmapRes.value.data?.data || [];
        // Sort by risk_score descending so highest risk renders first/on top
        const sorted = [...allSegs].sort(
          (a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0)
        );
        setSegments(sorted);
        console.log(`Loaded ${sorted.length} segments for ${cityKey}`);
        console.log('Sample segment:', sorted[0]);
      }
      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value.data;
        setStats(d.stats);
        setMetadata(d.stats?.metadata);
      }
      if (topRes.status === 'fulfilled') {
        setTopDangerous(topRes.value.data?.segments || []);
      }
    } catch (err) {
      toast.error('Failed to load city data');
      console.error(err);
    } finally {
      setMapLoading(false);
      setTimeout(() => setMapReady(true), 300);
    }
  }, []);

  // ── initialize twin ──────────────────────────────────────────────────────────
  const handleInitialize = useCallback(async (cityKey) => {
    setInitializingCity(cityKey);
    toast('Building digital twin... this may take 2-5 minutes.', { icon: '⏳', duration: 8000 });
    try {
      const res = await api.twinInitialize(cityKey, false);
      if (res.data?.status === 'success') {
        toast.success(`Digital twin for ${cityKey} is ready!`);
        const citiesRes = await api.twinCities();
        setCities(citiesRes.data?.cities || []);
        setSelectedCity(cityKey);
        setMapKey(`map-${cityKey}-${Date.now()}`);
        await loadCityData(cityKey);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Initialization failed');
    } finally {
      setInitializingCity(null);
    }
  }, [loadCityData]);

  // ── select city ──────────────────────────────────────────────────────────────
  const handleCitySelect = useCallback((cityKey) => {
    if (cityKey === selectedCity) return;
    setSelectedCity(cityKey);
    setSelectedSegment(null);
    setDetailSegment(null);
    setSidebarTab('stats');
    setMapReady(false);
    setMapKey(`map-${cityKey}-${Date.now()}`);
    loadCityData(cityKey);
  }, [loadCityData, selectedCity]);

  // ── segment detail ───────────────────────────────────────────────────────────
  const fetchSegmentDetail = useCallback(async (seg) => {
    setSelectedSegment(seg.segment_id);
    setSidebarTab('detail');
    if (selectedCity) {
      try {
        const res = await api.twinSegmentDetails(selectedCity, seg.segment_id);
        setDetailSegment(res.data?.segment || seg);
      } catch {
        setDetailSegment(seg);
      }
    } else {
      setDetailSegment(seg);
    }
  }, [selectedCity]);

  // ── refresh ──────────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    if (!selectedCity) return;
    setLoading(true);
    try {
      await api.twinRefresh(selectedCity);
      toast.success('Twin refreshed!');
      setMapKey(`map-${selectedCity}-${Date.now()}`);
      await loadCityData(selectedCity);
    } catch {
      toast.error('Refresh failed');
    } finally {
      setLoading(false);
    }
  }, [selectedCity, loadCityData]);

  // ── filtered + capped segments for map ───────────────────────────────────────
  const filteredSegments = useMemo(() => {
    const filtered = segments.filter((s) => (s.risk_score ?? 0) >= riskFilter);
    // Always include selected segment
    if (selectedSegment) {
      const sel = segments.find((s) => s.segment_id === selectedSegment);
      if (sel && !filtered.find((s) => s.segment_id === sel.segment_id)) {
        return [sel, ...filtered].slice(0, MAX_MAP_SEGMENTS);
      }
    }
    return filtered.slice(0, MAX_MAP_SEGMENTS);
  }, [segments, riskFilter, selectedSegment]);

  const totalFiltered = useMemo(
    () => segments.filter((s) => (s.risk_score ?? 0) >= riskFilter).length,
    [segments, riskFilter]
  );

  // city center from backend data
  const cityConfig   = cities.find((c) => c.key === selectedCity);
  const cityCenter   = cityConfig?.center
    ? { lat: cityConfig.center[0], lng: cityConfig.center[1] }
    : CITY_CENTERS.delhi;
  const cityZoom     = cityConfig?.zoom_level || 12;

  // KPIs
  const riskStats    = stats?.risk_statistics    || {};
  const networkStats = stats?.network_statistics  || {};
  const accStats     = stats?.accident_statistics || {};

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FiMap className="text-pbi-blue" />
            Digital Twin — Road Network
          </h1>
          <p className="text-sm text-pbi-muted mt-0.5">
            Virtual copy of road networks with real-time risk simulation
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedCity && (
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                         bg-pbi-bg2 border border-pbi-border text-pbi-text2 hover:text-white
                         transition-all duration-200 disabled:opacity-50"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          )}
        </div>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<FiMap />}          value={networkStats.total_edges?.toLocaleString() ?? segments.length.toLocaleString() ?? '—'} label="Road Segments"    color="#2563EB" delay={0}    />
        <KPICard icon={<FiAlertTriangle />} value={accStats.total_accidents?.toLocaleString() ?? '—'}                                    label="Total Accidents"  color="#EF4444" delay={0.05} />
        <KPICard icon={<FiActivity />}      value={riskStats.mean_risk != null ? `${riskStats.mean_risk.toFixed(1)}%` : '—'}             label="Avg Risk Score"   color="#F59E0B" delay={0.1}  />
        <KPICard icon={<FiAlertTriangle />} value={riskStats.high_risk_count?.toLocaleString() ?? '—'}                                   label="High Risk Segs"   color="#EF4444" delay={0.15} subtext="Risk ≥ 75%" />
      </div>

      {/* Filter Controls */}
      <div className="glass-card-static p-4 rounded-xl">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <label className="text-xs text-pbi-muted whitespace-nowrap">
              Show Risk ≥ <span className="text-white font-bold">{riskFilter}%</span>
            </label>
            <input
              type="range" min={0} max={90} step={10}
              value={riskFilter}
              onChange={(e) => setRiskFilter(Number(e.target.value))}
              className="w-28 accent-pbi-blue"
            />
          </div>

          {/* Quick filter buttons */}
          <div className="flex gap-1.5 flex-wrap">
            {[
              { label: '🌐 All',      value: 0,  col: 'text-pbi-muted'   },
              { label: '🟡 Med+ 40%', value: 40, col: 'text-pbi-yellow'  },
              { label: '🟠 High 60%', value: 60, col: 'text-orange-400'  },
              { label: '🔴 Very High 80%', value: 80, col: 'text-pbi-red'},
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setRiskFilter(f.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all
                            ${riskFilter === f.value
                              ? `${f.col} border-current bg-white/5`
                              : 'border-pbi-border text-pbi-muted hover:text-white bg-pbi-bg2'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Segment count */}
          <div className="ml-auto text-xs text-pbi-muted">
            {segments.length > 0 ? (
              <>
                Rendering{' '}
                <span className="text-white font-bold">{filteredSegments.length}</span>
                {totalFiltered > MAX_MAP_SEGMENTS && (
                  <span className="text-pbi-yellow"> / {MAX_MAP_SEGMENTS} cap</span>
                )}
                {' '}of{' '}
                <span className="text-white font-bold">{totalFiltered}</span> matching
                {' '}({segments.length.toLocaleString()} total)
              </>
            ) : (
              <span>No segments loaded</span>
            )}
          </div>
        </div>

        {/* Color scale */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          {[
            { label: 'No Data',         color: '#6B7280' },
            { label: 'Low Risk <20%',   color: '#16A34A' },
            { label: 'Low-Mod 20-40%',  color: '#D97706' },
            { label: 'Moderate 40-60%', color: '#EA580C' },
            { label: 'High Risk 60%+',  color: '#DC2626' },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-6 h-2 rounded-sm" style={{ backgroundColor: l.color }} />
              <span className="text-[10px] text-pbi-text2">{l.label}</span>
            </div>
          ))}
        </div>

        {/* Performance warning */}
        {riskFilter === 0 && segments.length > 1000 && (
          <p className="mt-2 text-xs text-pbi-yellow flex items-center gap-1">
            ⚡ Showing top {MAX_MAP_SEGMENTS} of {segments.length.toLocaleString()} segments.
            Use filters above to see specific risk levels without performance issues.
          </p>
        )}
      </div>

      {/* Map + Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">

        {/* MAP */}
        <div className="glass-card-static rounded-xl overflow-hidden" style={{ height: 560 }}>
          {mapLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <LoadingSpinner text="Loading road segments..." />
              <p className="text-xs text-pbi-muted">Processing {selectedCity} network data</p>
            </div>
          ) : !selectedCity ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <FiMap className="text-5xl text-pbi-muted" />
              <p className="text-white font-semibold">Select a city to view road network</p>
            </div>
          ) : !mapReady ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner text="Preparing map..." />
            </div>
          ) : (
            <MapContainer
              key={mapKey}
              center={[cityCenter.lat, cityCenter.lng]}
              zoom={cityZoom}
              style={{ height: '100%', width: '100%' }}
              preferCanvas={true}
              zoomAnimation={false}
              markerZoomAnimation={false}
              updateWhenZooming={false}
              updateWhenIdle={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
              <MapRecenter center={cityCenter} zoom={cityZoom} />

              {filteredSegments.map((seg, idx) => {
                const coords = seg.coordinates;
                // Validate coordinates exist and have at least 2 points
                if (!coords || !Array.isArray(coords) || coords.length < 2) return null;
                // Validate each coord is [lat, lon] numbers
                if (!coords[0] || coords[0].length < 2) return null;
                if (typeof coords[0][0] !== 'number' || typeof coords[0][1] !== 'number') return null;

                const color      = getSegmentColor(seg);
                const weight     = getSegmentWeight(seg);
                const isSelected = selectedSegment === seg.segment_id;
                const riskScore  = seg.risk_score ?? 0;

                return (
                  <Polyline
                    key={seg.segment_id || `seg-${idx}`}
                    positions={coords}
                    pathOptions={{
                      color:   isSelected ? '#60A5FA' : color,
                      weight:  isSelected ? weight + 3 : weight,
                      opacity: isSelected ? 1.0 : 0.85,
                    }}
                    eventHandlers={{
                      click: () => fetchSegmentDetail(seg),
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: 170, fontFamily: 'sans-serif' }}>
                        <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 3px', color: '#111' }}>
                          {seg.road_name || seg.road_name || seg.road_name || seg.name || 'Unnamed Road'}
                        </p>
                        <p style={{ fontSize: 11, color: '#666', margin: '0 0 6px' }}>
                          {seg.road_type || seg.road_category || 'Unknown type'}
                        </p>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 11, color: '#666' }}>Risk Score</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: getSegmentColor(seg) }}>
                            {riskScore.toFixed(1)}%
                          </span>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 11, color: '#666' }}>Category</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>
                            {seg.risk_category || '—'}
                          </span>
                        </div>
                        {seg.total_accidents != null && (
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 3 }}>
                            <span style={{ fontSize: 11, color: '#666' }}>Accidents</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>
                              {seg.total_accidents}
                            </span>
                          </div>
                        )}
                        {seg.length_m != null && (
                          <div style={{ display:'flex', justifyContent:'space-between' }}>
                            <span style={{ fontSize: 11, color: '#666' }}>Length</span>
                            <span style={{ fontSize: 11, color: '#333' }}>
                              {(seg.length_m / 1000).toFixed(2)} km
                            </span>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Polyline>
                );
              })}
            </MapContainer>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="flex flex-col gap-4">
          <CitySelector
            cities={cities}
            selectedCity={selectedCity}
            onSelect={handleCitySelect}
            onInitialize={handleInitialize}
            initializingCity={initializingCity}
          />

          {selectedCity && (
            <div className="flex gap-1 bg-pbi-bg2 rounded-lg p-1">
              {[
                { id: 'stats',  label: 'Stats',   icon: <FiActivity /> },
                { id: 'top',    label: 'Top Risk', icon: <FiAlertTriangle /> },
                { id: 'detail', label: 'Segment',  icon: <FiInfo /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSidebarTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2
                              rounded-md text-xs font-medium transition-all duration-200
                              ${sidebarTab === tab.id
                                ? 'bg-pbi-blue text-white shadow'
                                : 'text-pbi-muted hover:text-white'}`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          )}

          {selectedCity && (
            <>
              {sidebarTab === 'stats' && (
                <>
                  <StatisticsPanel stats={stats} metadata={metadata} />
                  <RiskLegend />
                </>
              )}
              {sidebarTab === 'top' && (
                <TopDangerousList
                  segments={topDangerous}
                  onSelectSegment={fetchSegmentDetail}
                  selectedSegmentId={selectedSegment}
                  loading={mapLoading}
                />
              )}
              {sidebarTab === 'detail' && (
                <SegmentDetailPanel
                  segment={detailSegment}
                  onClose={() => {
                    setDetailSegment(null);
                    setSelectedSegment(null);
                    setSidebarTab('stats');
                  }}
                  onSimulate={() => {
                    toast('Go to Simulation page to run scenarios', { icon: '🔬' });
                  }}
                />
              )}
            </>
          )}

          {!selectedCity && (
            <div className="glass-card-static rounded-xl p-6 text-center">
              <FiMap className="text-3xl text-pbi-muted mx-auto mb-3" />
              <p className="text-sm text-white font-medium">Select a city to begin</p>
              <p className="text-xs text-pbi-muted mt-1">
                Initialize a digital twin to view the risk heatmap
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitalTwinPage;
