from flask import Flask, render_template, jsonify
import urllib.request
import xml.etree.ElementTree as ET
import ssl
import re
import hashlib

app = Flask(__name__)

# URL for BigQuery Release Notes Feed
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def clean_html_to_text(html_content):
    """Strip HTML tags and normalize whitespace for plain text tweets."""
    if not html_content:
        return ""
    # Remove HTML tags
    text = re.sub(r'<[^<]+?>', '', html_content)
    # Decode HTML entities (basic ones)
    text = text.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"').replace('&#39;', "'")
    # Collapse multiple whitespaces/newlines into a single space
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def fetch_and_parse_feed():
    """Fetch BigQuery Release Notes XML feed and parse into individual updates."""
    # Bypassing SSL context validation for macOS local environment compatibility
    context = ssl._create_unverified_context()
    req = urllib.request.Request(
        FEED_URL, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AntigravityFeedReader/1.0'}
    )
    
    with urllib.request.urlopen(req, context=context) as response:
        xml_data = response.read()
        
    root = ET.fromstring(xml_data)
    namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
    entries = root.findall('atom:entry', namespaces)
    
    updates = []
    
    for entry in entries:
        # Extract title (which represents the date in this feed)
        date_str = entry.find('atom:title', namespaces)
        date_str = date_str.text.strip() if date_str is not None else "Unknown Date"
        
        # Extract the content HTML
        content_element = entry.find('atom:content', namespaces)
        content_html = content_element.text if content_element is not None else ""
        
        if not content_html:
            continue
            
        # Parse updates separated by <h3> tag
        chunks = content_html.split('<h3>')
        for i, chunk in enumerate(chunks):
            if not chunk.strip():
                continue
                
            if '</h3>' in chunk:
                parts = chunk.split('</h3>', 1)
                update_type = parts[0].strip()
                update_html = parts[1].strip()
                
                # Strip HTML for plain text tweeting
                plain_text = clean_html_to_text(update_html)
                
                # Generate unique ID based on date and description
                content_hash = hashlib.md5((date_str + update_html[:100]).encode('utf-8')).hexdigest()
                update_id = f"up-{content_hash[:12]}"
                
                # Identify categories for filtering based on content if necessary, 
                # but update_type (Feature, Changed, Deprecated, Issue, Fixed) is the primary one
                updates.append({
                    'id': update_id,
                    'date': date_str,
                    'type': update_type,
                    'html': update_html,
                    'text': plain_text
                })
                
    return updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    try:
        updates = fetch_and_parse_feed()
        return jsonify({
            'success': True,
            'count': len(updates),
            'updates': updates
        })
    except Exception as e:
        app.logger.error(f"Error fetching release notes: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5002)
