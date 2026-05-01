# backend/ml/delhi_data_loader.py
import os, hashlib, logging
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from config import DATA_DIR
    DELHI_DATASETS_DIR = os.path.join(DATA_DIR, "delhiDatasets")
except:
    DELHI_DATASETS_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "delhiDatasets")

# Known Delhi locations → GPS
DELHI_LOCATIONS = {
    "connaught place": (28.6315, 77.2167), "cp": (28.6315, 77.2167),
    "india gate": (28.6129, 77.2295), "karol bagh": (28.6519, 77.1909),
    "chandni chowk": (28.6507, 77.2334), "nehru place": (28.5494, 77.2501),
    "lajpat nagar": (28.5700, 77.2373), "saket": (28.5244, 77.2066),
    "dwarka": (28.5921, 77.0460), "rohini": (28.7325, 77.1160),
    "pitampura": (28.6919, 77.1208), "vasant kunj": (28.5254, 77.1549),
    "mehrauli": (28.5068, 77.1750), "kashmere gate": (28.6676, 77.2284),
    "rajouri garden": (28.6435, 77.1184), "janakpuri": (28.6214, 77.0873),
    "uttam nagar": (28.5995, 77.0566), "shahdara": (28.6300, 77.2900),
    "laxmi nagar": (28.6304, 77.2773), "preet vihar": (28.6415, 77.2966),
    "kalkaji": (28.5470, 77.2638), "greater kailash": (28.5540, 77.2378),
    "gk": (28.5540, 77.2378), "hauz khas": (28.5494, 77.2006),
    "aiims": (28.5672, 77.2074), "safdarjung": (28.5631, 77.2098),
    "green park": (28.5587, 77.2078), "malviya nagar": (28.5376, 77.2188),
    "sarojini nagar": (28.5741, 77.1854), "defence colony": (28.5835, 77.2265),
    "kirti nagar": (28.6530, 77.1077), "moti nagar": (28.6515, 77.1133),
    "patel nagar": (28.6496, 77.1554), "rajendra place": (28.6450, 77.1750),
    "pragati maidan": (28.6234, 77.2443), "ito": (28.6289, 77.2414),
    "moolchand": (28.5673, 77.2307), "ashram": (28.5545, 77.2576),
    "sarai kale khan": (28.5931, 77.2507), "nizamuddin": (28.5893, 77.2431),
    "okhla": (28.5300, 77.2700), "badarpur": (28.4934, 77.3027),
    "dhaula kuan": (28.5831, 77.1667), "azadpur": (28.6915, 77.1838),
    "model town": (28.6986, 77.1628), "civil lines": (28.6836, 77.2198),
    "dariyaganj": (28.6456, 77.2423), "paharganj": (28.6430, 77.2100),
    "new delhi station": (28.6425, 77.2196), "old delhi": (28.6562, 77.2410),
    "narela": (28.8525, 77.0929), "bawana": (28.7762, 77.0513),
    "mundka": (28.6841, 77.0301), "najafgarh": (28.5683, 76.9798),
    "punjabi bagh": (28.6673, 77.1212), "wazirpur": (28.6964, 77.1562),
    "gt road": (28.6800, 77.2500), "mathura road": (28.5880, 77.2400),
    "ring road": (28.6000, 77.2200), "outer ring road": (28.6500, 77.2000),
    "rohtak road": (28.6500, 77.0500), "nh 8": (28.5600, 77.1000),
    "nh 24": (28.6100, 77.2800), "nh 2": (28.5200, 77.2700),
    "nh 44": (28.6139, 77.2090), "nh 48": (28.6139, 77.2090),
    "tilak nagar": (28.6350, 77.0950), "subhash nagar": (28.6345, 77.0750),
    "vikaspuri": (28.6330, 77.0700), "r k puram": (28.5680, 77.1860),
    "munirka": (28.5560, 77.1780), "katwaria sarai": (28.5430, 77.1950),
    "ber sarai": (28.5470, 77.1900), "jor bagh": (28.5860, 77.1990),
    "lodhi road": (28.5920, 77.2190), "khan market": (28.6005, 77.2265),
    "noida": (28.5355, 77.3910), "gurgaon": (28.4595, 77.0266),
    "ghaziabad": (28.6692, 77.4538), "faridabad": (28.4089, 77.3178),
    "mb road": (28.5100, 77.2600), "azoze": (28.6100, 77.2200),
    "wazirabad": (28.7100, 77.2200), "yamuna": (28.6200, 77.2600),
    "barakhamba": (28.6320, 77.2180), "mori gate": (28.6670, 77.2250),
    "red fort": (28.6562, 77.2410), "jama masjid": (28.6507, 77.2334),
}

def name_to_gps(name, city_center=(28.6139, 77.2090)):
    if not isinstance(name, str) or not name.strip():
        return None, None
    key = name.lower().strip().replace("-", " ").replace("_", " ")
    # Remove common prefixes
    for prefix in ["dtc ", "bus ", "metro ", "near ", "opposite ", "towards "]:
        key = key.replace(prefix, "")
    key = key.strip()
    if key in DELHI_LOCATIONS:
        return DELHI_LOCATIONS[key]
    for loc_name, coords in DELHI_LOCATIONS.items():
        if loc_name in key or key in loc_name:
            return coords
    # Hash-based deterministic position within Delhi bbox
    h = int(hashlib.md5(key.encode()).hexdigest()[:8], 16)
    lat = city_center[0] + ((h % 10000) / 10000 - 0.5) * 0.35
    lon = city_center[1] + (((h >> 16) % 10000) / 10000 - 0.5) * 0.35
    lat = max(28.4041, min(28.8836, lat))
    lon = max(76.8380, min(77.3490, lon))
    return round(lat, 6), round(lon, 6)

def _find_col(columns, keywords):
    for col in columns:
        cl = col.lower().strip()
        for kw in keywords:
            if kw.lower() in cl:
                return col
    return None

def load_delhi_datasets():
    if not os.path.exists(DELHI_DATASETS_DIR):
        logger.warning(f"Delhi datasets dir not found: {DELHI_DATASETS_DIR}")
        return [], []
    all_records = []
    dataset_info = []
    subdirs = sorted([d for d in os.listdir(DELHI_DATASETS_DIR)
                      if os.path.isdir(os.path.join(DELHI_DATASETS_DIR, d))])
    for subdir in subdirs:
        dir_path = os.path.join(DELHI_DATASETS_DIR, subdir)
        csv_files = sorted([f for f in os.listdir(dir_path) if f.endswith('.csv')])
        dir_records = 0
        for csv_file in csv_files:
            csv_path = os.path.join(dir_path, csv_file)
            try:
                df = pd.read_csv(csv_path, encoding='utf-8', on_bad_lines='skip', low_memory=False)
            except:
                try:
                    df = pd.read_csv(csv_path, encoding='latin-1', on_bad_lines='skip', low_memory=False)
                except Exception as e:
                    logger.debug(f"Skip {csv_path}: {e}")
                    continue
            if len(df) == 0:
                continue
            cols = list(df.columns)
            loc_col = _find_col(cols, ["road", "circle", "area", "zone", "location",
                                        "name", "place", "spot", "stretch", "sector",
                                        "locality", "junction", "intersection", "traffic"])
            fatal_col = _find_col(cols, ["fatal", "killed", "death", "dead"])
            grievous_col = _find_col(cols, ["grievous", "serious", "severe", "injured"])
            minor_col = _find_col(cols, ["minor", "slight", "non_fatal"])
            total_col = _find_col(cols, ["total", "accident", "crash", "case", "count",
                                          "incident", "number_of"])
            lat_col = _find_col(cols, ["lat", "latitude"])
            lon_col = _find_col(cols, ["lon", "lng", "longitude", "long"])
            for _, row in df.iterrows():
                loc_name = None
                if loc_col and loc_col in row.index:
                    val = row[loc_col]
                    if pd.notna(val):
                        loc_name = str(val).strip()
                        if loc_name.lower() in ('nan', '', 'none', 'nan'):
                            loc_name = None
                if not loc_name:
                    continue
                lat, lon = None, None
                if lat_col and lon_col and lat_col in row.index and lon_col in row.index:
                    try:
                        lat = float(row[lat_col])
                        lon = float(row[lon_col])
                        if not (28.0 < lat < 29.5 and 76.0 < lon < 78.0):
                            lat, lon = None, None
                    except:
                        pass
                if lat is None or lon is None:
                    lat, lon = name_to_gps(loc_name)
                if lat is None:
                    continue
                fatal = grievous = minor = total = 0
                if fatal_col and fatal_col in row.index:
                    try:
                        v = row[fatal_col]
                        if pd.notna(v): fatal = int(float(v))
                    except: pass
                if grievous_col and grievous_col in row.index:
                    try:
                        v = row[grievous_col]
                        if pd.notna(v): grievous = int(float(v))
                    except: pass
                if minor_col and minor_col in row.index:
                    try:
                        v = row[minor_col]
                        if pd.notna(v): minor = int(float(v))
                    except: pass
                if total_col and total_col in row.index:
                    try:
                        v = row[total_col]
                        if pd.notna(v): total = int(float(v))
                    except: pass
                if total == 0 and (fatal + grievous + minor) > 0:
                    total = fatal + grievous + minor
                if total == 0:
                    total = 1
                severity = "Fatal" if fatal > 0 else ("Grievous" if grievous > 0 else "Minor")
                all_records.append({
                    "source": subdir,
                    "file": csv_file,
                    "location_name": loc_name,
                    "lat": lat, "lon": lon,
                    "fatal": fatal, "grievous": grievous, "minor": minor,
                    "total": total, "severity": severity,
                })
                dir_records += 1
            dataset_info.append({
                "directory": subdir, "filename": csv_file,
                "records": len(df), "path": os.path.join(subdir, csv_file),
            })
        logger.info(f"  {subdir}: {dir_records} location records")
    logger.info(f"  TOTAL Delhi records: {len(all_records)} from {len(dataset_info)} CSVs")
    return all_records, dataset_info

def get_delhi_datasets_info():
    if not os.path.exists(DELHI_DATASETS_DIR):
        return []
    info = []
    subdirs = sorted([d for d in os.listdir(DELHI_DATASETS_DIR)
                      if os.path.isdir(os.path.join(DELHI_DATASETS_DIR, d))])
    for subdir in subdirs:
        dir_path = os.path.join(DELHI_DATASETS_DIR, subdir)
        csv_files = sorted([f for f in os.listdir(dir_path) if f.endswith('.csv')])
        total_rows = 0
        cols_list = []
        for csv_file in csv_files:
            try:
                df = pd.read_csv(os.path.join(dir_path, csv_file), nrows=5, on_bad_lines='skip')
                cols_list.extend(list(df.columns))
                with open(os.path.join(dir_path, csv_file), 'r', encoding='utf-8', errors='ignore') as f:
                    total_rows += sum(1 for _ in f) - 1
            except:
                pass
        info.append({
            "name": subdir.replace("_", " ").replace("-", " ").title(),
            "directory": subdir,
            "csv_count": len(csv_files),
            "csv_files": csv_files,
            "total_rows": total_rows,
            "columns": list(dict.fromkeys(cols_list))[:20],
            "status": "found",
        })
    return info
