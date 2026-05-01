import os
import json
import pandas as pd
from fastapi import APIRouter, HTTPException
from config import OUTPUTS_DIR, DATA_DIR, PRIMARY_DATASET, SECONDARY_DATASET, MODELS_DIR

router = APIRouter(prefix="/api", tags=["Data"])


@router.get("/datasets/info")
def get_datasets_info():
    """Return info about ALL datasets including 10 Delhi datasets."""
    datasets = []

    # 1) Standard primary/secondary if they exist
    summary_path = os.path.join(OUTPUTS_DIR, "eda_summary.json")
    if os.path.exists(summary_path):
        with open(summary_path) as f:
            summary = json.load(f)
        for key, ds in summary.items():
            datasets.append({
                "name": ds.get("name", key),
                "filename": ds.get("filename", ""),
                "records": ds.get("total_records", 0),
                "features": ds.get("total_features", 0),
                "severity_classes": ds.get("severity_classes", 0),
                "class_distribution": ds.get("class_distribution", {}),
                "columns": ds.get("columns", []),
                "status": "loaded",
                "type": "standard",
            })
    else:
        for fname, label in [(PRIMARY_DATASET, "NHAI Multi-Corridor"), (SECONDARY_DATASET, "Kaggle India Severity")]:
            fp = os.path.join(DATA_DIR, fname)
            datasets.append({
                "name": label, "filename": fname,
                "records": 0, "features": 0, "severity_classes": 0,
                "status": "found" if os.path.exists(fp) else "not_found",
                "type": "standard",
            })

    # 2) ALL 10 Delhi datasets
    try:
        from ml.delhi_data_loader import get_delhi_datasets_info
        delhi_info = get_delhi_datasets_info()
        for ds in delhi_info:
            datasets.append({
                "name": ds["name"],
                "filename": f"{ds['csv_count']} CSVs",
                "records": ds["total_rows"],
                "features": len(ds.get("columns", [])),
                "severity_classes": 0,
                "csv_files": ds["csv_files"],
                "directory": ds["directory"],
                "status": ds["status"],
                "type": "delhi",
            })
    except Exception as e:
        import traceback; traceback.print_exc()

    return {"datasets": datasets, "total_datasets": len(datasets)}


@router.get("/filters/options")
def get_filter_options():
    default_options = {
        "Day_of_Week": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
        "Weather_Conditions": ["Clear","Rainy","Foggy","Cloudy","Windy","Other"],
        "Vehicle_Types": ["Car","Truck","Bus","Two Wheeler","Auto Rickshaw","Other"],
        "Road_Conditions": ["Straight","Curve","Bridge","Intersection","Other"],
        "Causes": ["Overspeeding","Drunk Driving","Wrong Side Driving","Distracted Driving","Other"],
        "Time_Periods": ["Morning","Afternoon","Evening","Night"],
        "Models": ["RandomForest","XGBoost","GradientBoosting","SVM","LogisticRegression"],
    }
    filter_data_path = os.path.join(OUTPUTS_DIR, "filter_options.json")
    if os.path.exists(filter_data_path):
        with open(filter_data_path) as f:
            saved = json.load(f)
        default_options.update(saved)
    return default_options


@router.get("/health")
def health_check():
    import datetime
    from config import CITIES_CONFIG
    models_exist = (os.path.exists(MODELS_DIR) and
        any(f.endswith(".joblib") for f in os.listdir(MODELS_DIR))
        if os.path.exists(MODELS_DIR) else False)
    twin_status = {}
    try:
        from api.routes_digital_twin import digital_twins
        for ck in CITIES_CONFIG:
            if ck in digital_twins:
                m = digital_twins[ck].get_metadata()
                twin_status[ck] = {"status": m.get("status","unknown"),
                    "total_segments": m.get("total_segments",0),
                    "high_risk_segments": m.get("high_risk_segments",0)}
            else:
                twin_status[ck] = {"status":"not_initialized","total_segments":0,"high_risk_segments":0}
    except: pass
    return {
        "status": "healthy", "models_loaded": models_exist,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "datasets": {
            "primary": os.path.exists(os.path.join(DATA_DIR, PRIMARY_DATASET)),
            "secondary": os.path.exists(os.path.join(DATA_DIR, SECONDARY_DATASET)),
        },
        "digital_twins": twin_status, "version": "2.0.0",
    }


@router.get("/data/preview/{dataset_key}")
def get_data_preview(dataset_key: str = "primary", page: int = 1, per_page: int = 25):
    """Preview standard or Delhi datasets."""
    # Standard datasets
    if dataset_key in ("primary", "secondary"):
        fname = PRIMARY_DATASET if dataset_key == "primary" else SECONDARY_DATASET
        filepath = os.path.join(DATA_DIR, fname)
        if not os.path.exists(filepath):
            raise HTTPException(404, f"File not found: {filepath}")
        df = pd.read_csv(filepath)
        total = len(df)
        tp = (total + per_page - 1) // per_page
        start = (page - 1) * per_page
        return {
            "columns": list(df.columns),
            "records": df.iloc[start:start+per_page].fillna("").to_dict(orient="records"),
            "total_records": total, "page": page, "per_page": per_page, "total_pages": tp,
        }

    # Delhi dataset: dataset_key = directory name, query param file=filename
    from fastapi import Query
    # Re-read query params from request
    import inspect
    frame = inspect.currentframe()
    # Use a simpler approach - check for delhi directory
    delhi_dir = os.path.join(DATA_DIR, "delhiDatasets", dataset_key)
    if not os.path.exists(delhi_dir):
        raise HTTPException(404, f"Dataset '{dataset_key}' not found")

    csv_files = sorted([f for f in os.listdir(delhi_dir) if f.endswith('.csv')])
    if not csv_files:
        raise HTTPException(404, f"No CSVs in {dataset_key}")

    # Combine all CSVs in this directory
    dfs = []
    for cf in csv_files:
        try:
            d = pd.read_csv(os.path.join(delhi_dir, cf), on_bad_lines='skip', low_memory=False)
            d["_source_file"] = cf
            dfs.append(d)
        except: pass
    if not dfs:
        raise HTTPException(500, "Could not read any CSV")
    df = pd.concat(dfs, ignore_index=True)
    total = len(df)
    tp = max(1, (total + per_page - 1) // per_page)
    start = (page - 1) * per_page
    return {
        "columns": list(df.columns),
        "records": df.iloc[start:start+per_page].fillna("").to_dict(orient="records"),
        "total_records": total, "page": page, "per_page": per_page,
        "total_pages": tp, "csv_files": csv_files,
    }
