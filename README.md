# Accident Severity Predictor

## Overview

The Accident Severity Predictor is a full-stack application designed to predict the severity of road accidents based on various factors such as weather conditions, road types, and vehicle types. The application consists of a backend built with Python and Flask, and a frontend built with React.

## Features

- **Data Analysis**: Exploratory Data Analysis (EDA) to understand accident patterns.
- **Machine Learning Models**: Multiple models to predict accident severity.
- **Interactive Visualizations**: Charts and graphs to visualize accident data.
- **Prediction Interface**: User-friendly interface to input accident details and get severity predictions.

## Project Structure

```
accidentPredictionProject/
├── accident-severity-predictor/
│   ├── backend/
│   │   ├── api/
│   │   ├── data/
│   │   ├── ml/
│   │   ├── outputs/
│   │   ├── venv/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   └── run_pipeline.py
│   ├── frontend/
│   │   ├── public/
│   │   ├── src/
│   │   ├── .gitignore
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── postcss.config.js
│   │   ├── README.md
│   │   └── tailwind.config.js
│   └── train_single_model.py
├── .gitignore
├── package-lock.json
└── package.json
```

## Backend

### Setup

1. Navigate to the backend directory:

```bash
cd accident-severity-predictor/backend
```

2. Create a virtual environment (optional but recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
```

3. Install the required dependencies:

```bash
pip install -r requirements.txt
```

### Running the Backend

Start the Flask server:

```bash
python main.py
```

The backend will start on `http://localhost:5000`.

### API Endpoints

- **Data Routes**: Endpoints for fetching accident and road data.
- **EDA Routes**: Endpoints for exploratory data analysis.
- **Model Routes**: Endpoints for training and evaluating models.
- **Prediction Routes**: Endpoints for making predictions.
- **SHAP Routes**: Endpoints for SHAP analysis.

## Frontend

### Setup

1. Navigate to the frontend directory:

```bash
cd accident-severity-predictor/frontend
```

2. Install the required dependencies:

```bash
npm install
```

### Running the Frontend

Start the React development server:

```bash
npm start
```

The frontend will start on `http://localhost:3000`.

## Data

The application uses two main datasets:

- `ETP_4_New_Data_Accidents.csv`: Contains accident data.
- `Road.csv`: Contains road data.

These datasets are located in the `backend/data` directory.

## Machine Learning

The machine learning pipeline includes:

- **Data Loading**: Loading and preprocessing the data.
- **Data Preprocessing**: Cleaning and transforming the data.
- **Model Training**: Training multiple models to predict accident severity.
- **Model Evaluation**: Evaluating the performance of the models.
- **Prediction**: Using the trained models to make predictions.

## Usage

1. **Data Analysis**: Use the EDA endpoints to analyze accident data.
2. **Model Training**: Use the model endpoints to train and evaluate models.
3. **Prediction**: Use the prediction endpoints to get severity predictions for new accident data.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.