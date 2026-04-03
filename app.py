from flask import Flask, render_template, jsonify, request
import sqlite3
import os

app = Flask(__name__)

# Database path
DB_PATH = os.path.join('data', 'gym.db')

# Create data folder if not exists
os.makedirs('data', exist_ok=True)

@app.route('/')
def index():
    return render_template('membership.html')

@app.route('/signup')
def signup():
    return render_template('signup.html')

@app.route('/confirm')
def confirm():
    return render_template('confirmation.html')

@app.route('/api/prices')
def get_prices():
    """Get current prices from database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Example query - adjust to your table structure
    cursor.execute("SELECT gym_type, ugym_price, powerzone_price FROM prices")
    rows = cursor.fetchall()
    
    prices = {}
    for row in rows:
        prices[row[0]] = [row[1], row[2]]
    
    conn.close()
    return jsonify(prices)

@app.route('/api/save-selection', methods=['POST'])
def save_selection():
    """Save user selection to database"""
    data = request.get_json()
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO selections (gym_type, extras, selected_gym, total_price, timestamp)
        VALUES (?, ?, ?, ?, datetime('now'))
    ''', (data['gymType'], ','.join(data['extras']), data['selectedGym'], data['totalPrice']))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)