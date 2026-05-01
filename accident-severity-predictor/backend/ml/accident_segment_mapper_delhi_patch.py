# Patch: add this method to AccidentSegmentMapper and call from map_all_accidents
# We'll do it via monkey-patch at import time

import logging
logger = logging.getLogger(__name__)

def map_delhi_datasets(self):
    """Map all 10 Delhi datasets to road segments."""
    from ml.delhi_data_loader import load_delhi_datasets
    records, _ = load_delhi_datasets()
    if not records:
        logger.warning("No Delhi dataset records found")
        return {}
    logger.info(f"Mapping {len(records)} Delhi records to segments...")
    mapped = {}
    mapped_count = 0
    unmapped_count = 0
    for i, rec in enumerate(records):
        lat, lon = rec["lat"], rec["lon"]
        if lat is None or lon is None:
            unmapped_count += 1
            continue
        segment_id, distance = self._find_nearest_segment(lat, lon)
        if segment_id is None:
            unmapped_count += 1
            continue
        accident = {
            "accident_id": f"delhi_{i}",
            "source": rec["source"],
            "severity": rec["severity"],
            "fatal": rec["fatal"],
            "grievous": rec["grievous"],
            "minor": rec["minor"],
            "location_name": rec["location_name"],
            "lat": lat, "lon": lon,
            "snap_distance_m": round(distance, 2),
        }
        if segment_id not in mapped:
            mapped[segment_id] = []
        mapped[segment_id].append(accident)
        mapped_count += 1
    logger.info(f"Delhi mapping: {mapped_count} mapped, {unmapped_count} unmapped")
    return mapped

# Monkey-patch the class
from ml.accident_segment_mapper import AccidentSegmentMapper
AccidentSegmentMapper.map_delhi_datasets = map_delhi_datasets

# Patch map_all_accidents to include Delhi datasets
_original_map_all = AccidentSegmentMapper.map_all_accidents

def patched_map_all(self):
    logger.info("Patched map_all_accidents: including Delhi datasets")
    combined = {}
    # Try ETP4
    try:
        etp4 = self.map_etp4_accidents()
        for seg_id, accidents in etp4.items():
            combined.setdefault(seg_id, []).extend(accidents)
    except Exception as e:
        logger.debug(f"ETP4 mapping skipped: {e}")
    # Try Road.csv
    try:
        road = self.map_road_csv_accidents()
        for seg_id, accidents in road.items():
            combined.setdefault(seg_id, []).extend(accidents)
    except Exception as e:
        logger.debug(f"Road.csv mapping skipped: {e}")
    # Delhi datasets (THE KEY ADDITION)
    try:
        delhi = self.map_delhi_datasets()
        for seg_id, accidents in delhi.items():
            combined.setdefault(seg_id, []).extend(accidents)
        logger.info(f"Delhi datasets added: {len(delhi)} segments")
    except Exception as e:
        logger.error(f"Delhi mapping failed: {e}")
    total_accidents = sum(len(v) for v in combined.values())
    logger.info(f"Combined: {total_accidents} accidents across {len(combined)} segments")
    aggregated = self.aggregate_segment_data(combined)
    from datetime import datetime
    from config import MAPPED_ACCIDENTS_DIR
    import os
    self.mapping_stats.update({
        "total_accidents": total_accidents,
        "mapped_accidents": total_accidents,
        "segments_with_accidents": len(aggregated),
        "mapping_rate_pct": round(len(aggregated) / max(len(self.edges_gdf), 1) * 100, 2),
        "mapped_at": datetime.now().isoformat(),
    })
    self.segment_mapping = aggregated
    return aggregated

AccidentSegmentMapper.map_all_accidents = patched_map_all
logger.info("AccidentSegmentMapper patched with Delhi dataset support")
