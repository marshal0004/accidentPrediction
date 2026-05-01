# Indian Road Accident Severity Prediction System - Deep Technical Analysis

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [File Map](#file-map)
- [Component Connections](#component-connections)
- [Key Flows](#key-flows)

## Overview

### Project Purpose
The Indian Road Accident Severity Prediction System is a machine learning-powered API that predicts road accident severity in India. It features a digital twin of road networks with risk heatmaps, scenario simulation, and what-if analysis capabilities.

### Tech Stack
- **Backend Framework**: FastAPI
- **ML Libraries**: scikit-learn, XGBoost, pandas, numpy
- **Geospatial**: OSMnx, GeoPandas
- **Database**: SQLite
- **Visualization**: Matplotlib, Seaborn
- **API Documentation**: Swagger UI
- **Containerization**: None (direct Python execution)

### Key Features
1. Accident severity prediction using multiple ML models
2. Digital twin of road networks for Delhi, Dehradun, and Bangalore
3. Risk heatmap generation
4. Scenario simulation for safety interventions
5. What-if analysis for policy decisions
6. Comprehensive EDA and visualization

## Architecture

### System Architecture
```
┌───────────────────────────────────────────────────────────────────────────────┐
│                                Client Applications                              │
└───────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌───────────────────────────────────────────────────────────────────────────────┐
│                                FastAPI Server (main.py)                         │
└───────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌───────────────────────────────────────────────────────────────────────────────┐
│                                API Routers (api/)                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  EDA       │  │ Prediction  │  │ Digital     │  │ What-If Analysis       │  │
│  │  (eda.py)  │  │ (predict.py)│  │ Twin        │  │ (what_if.py)           │  │
│  └─────────────┘  └─────────────┘  │  (digital_twin.py)  └─────────────────────────┘  │
│                                          │                                      │
│                                          ↓                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                         ML Components (ml/)                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────────┐  │  │
│  │  │ Predictor   │  │ Digital     │  │ Scenario Simulator            │  │  │
│  │  │ (predictor.py)│  │ Twin       │  │ (scenario_simulator.py)       │  │  │
│  │  └─────────────┘  │  (digital_twin.py)  └─────────────────────────────────┘  │  │
│  │                   │  ┌─────────────┐  ┌─────────────────────────────┐  │  │
│  │                   │  │ Risk        │  │ Heatmap Generator           │  │  │
│  │                   │  │ Calculator │  │ (heatmap_generator.py)      │  │  │
│  │                   │  │ (segment_risk_calculator.py)  └─────────────────────────────┘  │  │
│  │                   │  └─────────────┘  ┌─────────────────────────────┐  │  │
│  │                   │                  │ Road Network Loader         │  │  │
│  │                   │                  │ (road_network_loader.py)     │  │  │
│  │                   └──────────────────┴─────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌───────────────────────────────────────────────────────────────────────────────┐
│                                Data Layer                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Datasets   │  │ Models      │  │ Outputs     │  │ Database               │  │
│  │ (data/)    │  │ (outputs/models/)│  │ (outputs/)  │  │ (app.db)              │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Design Patterns

1. **Singleton Pattern**: Global predictor instance shared across routes
2. **Factory Pattern**: Model training and loading in trainer.py
3. **Strategy Pattern**: Multiple ML models with unified interface
4. **Facade Pattern**: DigitalTwin class as facade for complex operations
5. **Repository Pattern**: Data loading and caching mechanisms
6. **Observer Pattern**: Event-driven startup initialization

## File Map

### Root Files

```
.
├── main.py                          # FastAPI application entry point
├── config.py                         # Configuration settings and constants
├── database.py                      # SQLite database setup
├── requirements.txt                  # Python dependencies
├── run_pipeline.py                  # Training pipeline script
└── app.db                           # SQLite database
```

### API Routes (api/)

```
api/
├── __init__.py                      # Package initialization
├── routes_data.py                   # Dataset information endpoints
├── routes_digital_twin.py           # Digital twin management endpoints
├── routes_eda.py                    # Exploratory data analysis endpoints
├── routes_models.py                 # Model comparison endpoints
├── routes_predict.py                # Prediction endpoints
├── routes_shap.py                   # SHAP analysis endpoints
└── routes_what_if.py                 # What-if analysis endpoints
```

### ML Components (ml/)

```
ml/
├── __init__.py                      # Package initialization
├── accident_segment_mapper.py      # Maps accidents to road segments
├── data_loader.py                   # Loads and validates datasets
├── digital_twin.py                  # Digital twin orchestrator
├── evaluator.py                     # Model evaluation metrics
├── heatmap_generator.py             # Generates risk heatmaps
├── predictor.py                     # Prediction inference engine
├── preprocessor.py                  # Data preprocessing pipeline
├── road_network_loader.py          # Loads road networks from OSM
├── scenario_simulator.py            # Simulates safety interventions
├── segment_risk_calculator.py       # Calculates segment risk scores
├── shap_analyzer.py                 # SHAP feature importance analysis
├── trainer.py                      # Model training pipeline
└── models/                          # Individual model implementations
    ├── __init__.py                  # Package initialization
    ├── gradient_boosting.py         # Gradient Boosting model
    ├── logistic_regression.py       # Logistic Regression model
    ├── random_forest.py             # Random Forest model
    ├── svm_model.py                 # SVM model
    └── xgboost_model.py             # XGBoost model
```

### Data Directory (data/)

```
data/
├── delhiDatasets/                   # Delhi-specific accident datasets
├── mapped_accidents/                # Accident-to-segment mappings
│   └── delhi/                       # Delhi mappings
│       ├── mapping_stats.json       # Mapping statistics
│       └── segment_mapping.json     # Segment mapping data
└── road_networks/                   # Road network data
    ├── bangalore/                   # Bangalore road network
    ├── dehradun/                    # Dehradun road network
    └── delhi/                       # Delhi road network
        ├── delhi_edges.csv          # Road edges
        ├── delhi_metadata.json      # Network metadata
        └── delhi_roads.graphml      # GraphML format network
```

### Outputs Directory (outputs/)

```
outputs/
├── digital_twin/                   # Digital twin outputs
│   ├── bangalore/                   # Bangalore twin data
│   ├── dehradun/                    # Dehradun twin data
│   └── delhi/                       # Delhi twin data
│       ├── heatmap_grid.json        # Grid heatmap data
│       ├── heatmap_segments.json    # Segment heatmap data
│       ├── risk_stats.json          # Risk statistics
│       ├── segment_risks.json       # Segment risk scores
│       ├── top_dangerous.json       # Top dangerous segments
│       └── twin_metadata.json        # Twin metadata
├── models/                         # Trained models
│   ├── primary/                     # Primary dataset models
│   │   ├── GradientBoosting_model.joblib
│   │   ├── LogisticRegression_model.joblib
│   │   ├── RandomForest_model.joblib
│   │   ├── SVM_model.joblib
│   │   └── XGBoost_model.joblib
│   ├── secondary/                   # Secondary dataset models
│   │   ├── GradientBoosting_model.joblib
│   │   ├── LogisticRegression_model.joblib
│   │   ├── RandomForest_model.joblib
│   │   ├── SVM_model.joblib
│   │   └── XGBoost_model.joblib
│   ├── feature_info_primary.json    # Feature information
│   ├── feature_info_secondary.json  # Feature information
│   ├── label_encoder.joblib        # Label encoder
│   ├── scaler.joblib                # Feature scaler
│   ├── training_summary_primary.json # Training summary
│   └── training_summary_secondary.json # Training summary
├── plots/                          # Generated plots
│   ├── confusion_matrix_*.png       # Confusion matrices
│   ├── feature_importance_*.png     # Feature importance plots
│   ├── model_comparison_bar.png     # Model comparison
│   ├── roc_curves_all.png           # ROC curves
│   ├── shap_bar_*.png               # SHAP bar plots
│   └── shap_summary_*.png           # SHAP summary plots
├── shap/                           # SHAP analysis results
│   ├── all_shap_results_primary.json # SHAP results
│   ├── all_shap_results_secondary.json # SHAP results
│   ├── shap_feature_importance_*.json # Feature importance
│   └── *.png                        # SHAP visualization plots
├── chart_data_*.json               # Chart data for frontend
├── eda_summary.json                 # EDA summary statistics
├── filter_options.json              # Filter options
├── model_comparison.csv             # Model comparison data
├── model_comparison.json            # Model comparison results
├── pipeline_summary.json            # Pipeline summary
└── shap_feature_importance.json     # SHAP feature importance
```

## Component Connections

### Data Flow

```
[Client Request] → [FastAPI Router] → [ML Component] → [Data Layer] → [Response]
```

### API Contracts

#### Prediction API
- **Endpoint**: `POST /api/predict`
- **Input**: JSON with accident features
- **Output**: JSON with severity prediction and probabilities
- **Models**: RandomForest, XGBoost, GradientBoosting, SVM, LogisticRegression

#### Digital Twin API
- **Endpoint**: `GET /api/twin/{city}/initialize`
- **Input**: City key, force_rebuild flag
- **Output**: Twin metadata and status
- **Process**: Loads road network, maps accidents, calculates risks, generates heatmaps

#### What-If Analysis API
- **Endpoint**: `POST /api/what-if/{city}/segment/{id}/analyze`
- **Input**: Intervention ID
- **Output**: Risk reduction, cost analysis, ROI
- **Interventions**: street_lights, speed_cameras, median_barriers, road_widening, rumble_strips, signage_improvement

### Dependencies

```
main.py
├── config.py                        # Configuration
├── database.py                      # Database setup
├── api.routes_*                     # API routers
└── ml.*                             # ML components

api/routes_predict.py
└── ml/predictor.py                  # Prediction engine

api/routes_digital_twin.py
└── ml/digital_twin.py               # Digital twin orchestrator

ml/digital_twin.py
├── ml/road_network_loader.py        # Road network loading
├── ml/accident_segment_mapper.py    # Accident mapping
├── ml/segment_risk_calculator.py   # Risk calculation
├── ml/heatmap_generator.py          # Heatmap generation
└── ml/scenario_simulator.py         # Scenario simulation

ml/predictor.py
├── ml/models/*                      # Individual models
└── outputs/models/                  # Trained model artifacts
```

### Entry Points

1. **main.py**: FastAPI application entry
2. **run_pipeline.py**: Training pipeline entry
3. **api/**: REST API endpoints
4. **ml/**: Machine learning components

## Key Flows

### Training Flow

```
[run_pipeline.py] → [ml/data_loader.py] → [ml/preprocessor.py] → [ml/trainer.py] 
→ [ml/evaluator.py] → [ml/shap_analyzer.py] → [outputs/models/]
```

1. Load datasets from data/
2. Preprocess data (encoding, scaling, feature engineering)
3. Train multiple ML models
4. Evaluate model performance
5. Generate SHAP analysis
6. Save trained models and artifacts

### Prediction Flow

```
[Client] → [api/routes_predict.py] → [ml/predictor.py] → [outputs/models/] → [Response]
```

1. Client sends prediction request
2. Router validates input
3. Predictor loads appropriate model
4. Model makes prediction
5. Response returned to client

### Digital Twin Initialization Flow

```
[Client] → [api/routes_digital_twin.py] → [ml/digital_twin.py] → [ml/road_network_loader.py]
→ [ml/accident_segment_mapper.py] → [ml/segment_risk_calculator.py] 
→ [ml/heatmap_generator.py] → [outputs/digital_twin/]
```

1. Client requests twin initialization
2. Digital twin orchestrator coordinates components
3. Road network loaded from OSM
4. Accidents mapped to segments
5. Risk scores calculated
6. Heatmaps generated
7. Twin metadata saved

### What-If Analysis Flow

```
[Client] → [api/routes_what_if.py] → [ml/digital_twin.py] → [ml/scenario_simulator.py]
→ [Analysis Results]
```

1. Client specifies intervention and segment
2. Scenario simulator loads segment data
3. Intervention impact calculated
4. Cost-benefit analysis performed
5. Results returned to client

## Summary

The Indian Road Accident Severity Prediction System is a comprehensive machine learning application with:

- **31 Python files** organized in api/, ml/, and root directories
- **FastAPI-based REST API** with 8 router modules
- **5 ML models** (Random Forest, XGBoost, Gradient Boosting, SVM, Logistic Regression)
- **Digital twin capability** for 3 cities (Delhi, Dehradun, Bangalore)
- **What-if analysis** with 6 safety interventions
- **Comprehensive EDA** with multiple visualization options
- **SHAP analysis** for model interpretability

The system follows modern software architecture patterns and provides a robust foundation for accident severity prediction and policy analysis.