# BigQuery Release Notes Explorer 🚀

A premium web application built with **Python Flask** and vanilla **HTML, CSS, and JavaScript** that fetches, parses, and displays the official Google Cloud BigQuery Release notes XML feed, allowing you to select and tweet about updates.

---

## ✨ Features

* **Granular Parsing**: Splits daily aggregated entries in the feed into individual, category-coded update cards (Features, Issues, Changed, Deprecated, Fixed, Announcements).
* **Live Stats**: Displays real-time dashboards listing total updates, feature releases, issue tickets, changes/deprecations, and official announcements.
* **Instant Filtering & Search**: Filter updates by category type instantly or search through update descriptions, dates, and titles.
* **Ergonomic Card Selection**: Toggles card selection by clicking anywhere on a card's body, avoiding links, buttons, and code blocks for fluid mobile and desktop navigation.
* **Batch Select & Deselect**: Click the "Select All Visible" button to bulk-select or bulk-deselect all updates matching the active search query or filter tags.
* **Dynamic Tweet Thread Composer**: Selecting multiple updates opens an interactive tweet-threading modal that builds a sequential Twitter/X thread draft (`1/N`, `2/N`, etc.). Includes separate textareas for each post, individual copy triggers, and circular SVG progress ring character trackers.
* **Double Actions**: Share directly to Twitter/X using the Web Intent URL (with helper copy/paste toast guides for threads), or copy drafts to your clipboard with floating toast confirmation notifications.

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
**[http://127.0.0.1:5002](http://127.0.0.1:5002)**

---

## 🔗 Technical Data Flow
For a detailed sequence diagram and analysis of the backend XML parsing engine and frontend state machine, please read the [project_architecture_and_data_flow.md](project_architecture_and_data_flow.md) document.
