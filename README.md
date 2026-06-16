# BigQuery Release Notes Explorer 🚀

A premium web application built with **Python Flask** and vanilla **HTML, CSS, and JavaScript** that fetches, parses, and displays the official Google Cloud BigQuery Release notes XML feed, allowing you to select and tweet about updates.

---

## ✨ Features

* **Granular Parsing**: Splits daily aggregated entries in the feed into individual, category-coded update cards (Features, Issues, Changed, Deprecated, Fixed).
* **Live Stats**: Displays real-time dashboards listing total updates, feature releases, issue tickets, and code modifications.
* **Instant Filtering & Search**: Filter updates by category type instantly or search through update descriptions, dates, and titles.
* **Batch Tweet Drafting**: Select single or multiple updates using checkmarks, bringing up a sticky action bar to compile summary threads automatically.
* **Interactive Tweet Composer**: Includes a Twitter/X draft popup equipped with a circular SVG progress ring character tracker (exactly like Twitter's native interface) that changes color as you approach the 280-character limit.
* **Double Actions**: Share directly to Twitter using the Web Intent URL, or copy to your clipboard with a custom floating toast notification fallback.

---

## 📂 Project Structure

```bash
bigquery_release_notes/
│
├── app.py                            # Flask server (Fetches & parses Atom XML feed)
├── project_architecture_and_data_flow.md # In-depth technical guide & sequence diagrams
├── README.md                         # Project documentation
├── .gitignore                        # Git exclusion file
│
├── templates/
│   └── index.html                    # Frontend layout structure
│
└── static/
    ├── css/
    │   └── style.css                 # Dark obsidian glassmorphism design system
    └── js/
        └── app.js                    # UI state machine & character count calculation
```

---

## 🛠️ Quick Start Guide

### Prerequisites
Make sure you have Python 3 and `pip` installed:
```bash
python3 --version
```

### 1. Clone the project and navigate to it
```bash
git clone https://github.com/Fishimal/Fishimal-event-talks-app.git
cd Fishimal-event-talks-app
```

### 2. Install dependencies
Install Flask using pip:
```bash
pip3 install flask
```

### 3. Run the development server
Start the Flask app:
```bash
python3 app.py
```

### 4. Open the application
Open your web browser and navigate to:
**[http://127.0.0.1:5001](http://127.0.0.1:5001)**

---

## 🔗 Technical Data Flow
For a detailed sequence diagram and analysis of the backend XML parsing engine and frontend state machine, please read the [project_architecture_and_data_flow.md](project_architecture_and_data_flow.md) document.
