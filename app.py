from flask import Flask, request, render_template, url_for, redirect, session, jsonify

from dotenv import load_dotenv
load_dotenv("key.env")
import mysql.connector

import random
import string
import os



app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")   #protect sessions ex cookie



# Use root with empty password (default for local MySQL)
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
    "raise_on_warnings": True,
}
def get_connection():
    return mysql.connector.connect(**DB_CONFIG)

def generate_membership_id():
    """Generate unique 6-digit membership ID"""
    conn = get_connection()
    try:
        cur = conn.cursor()
        while True:
            new_id = ''.join(random.choices(string.digits, k=6))
            cur.execute("SELECT 1 FROM Account WHERE MembershipID = %s", (new_id,))
            if not cur.fetchone():
                return new_id
    finally:
        cur.close()
        conn.close()

def get_user_membership(membership_id):
    """Fetch latest active membership for user"""
    conn = get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            """SELECT gym_name, membership_plan as plan, start_date, end_date, 
                      ticket_type, total_price as price, payment_status
               FROM Memberships 
               WHERE MembershipID = %s AND payment_status = 'completed'
               ORDER BY start_date DESC 
               LIMIT 1""",
            (membership_id,)
        )
        return cur.fetchone()
    finally:
        cur.close()
        conn.close()

@app.route("/")
def index():
    return render_template('index.html')

@app.route('/membership')
def membership():
    if 'user_id' not in session:
        session['next_url'] = url_for('membership')
        return redirect(url_for('signup'))
    return render_template('membership.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        email = request.form.get("email", "").strip()
        fname = request.form.get("fname", "").strip()
        lname = request.form.get("Lname", "").strip()
        password = request.form.get("pass_word", "").strip()
        
        if not all([email, fname, lname, password]):
            return "Missing required fields", 400
            
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT 1 FROM Account WHERE EMAIL = %s LIMIT 1", (email,))
            if cur.fetchone():
                return render_template("message.html", 
                                    message="Email already registered!", 
                                    redirect_url=url_for("signup"))
            
            membership_id = generate_membership_id()
            # PLAIN TEXT - no hashing
            plain_password = password
            
            cur.execute(
                """INSERT INTO Account (EMAIL, First_Name, Last_Name, MembershipID, Password_Hash) 
                   VALUES (%s, %s, %s, %s, %s)""",
                (email, fname, lname, membership_id, plain_password)
            )
            conn.commit()
            
            return render_template('signup.html', membership_id=membership_id)
        
        finally:
            cur.close()
            conn.close()
            
    return render_template('signup.html')

@app.route("/login", methods=['GET', 'POST'])
def account_page():
    if request.method == 'POST':
        identifier = request.form.get("membership", "").strip()
        password = request.form.get("pass_word", "").strip()
        
        conn = get_connection()
        try:
            cur = conn.cursor(dictionary=True)
            if '@' in identifier:
                cur.execute("SELECT * FROM Account WHERE EMAIL = %s", (identifier,))
            else:
                cur.execute("SELECT * FROM Account WHERE MembershipID = %s", (identifier,))
                
            user = cur.fetchone()
            
            # PLAIN TEXT comparison - direct match
            if user and user['Password_Hash'] == password:
                session['user_id'] = user['MembershipID']
                session['email'] = user['EMAIL']
                session['fname'] = user['First_Name']
                session['lname'] = user['Last_Name']
                
                next_url = session.pop('next_url', None)
                if next_url:
                    return redirect(next_url)
                return redirect(url_for('index'))
            else:
                return render_template("message.html", 
                                    message="Invalid credentials!", 
                                    redirect_url=url_for("account_page"))
        finally:
            cur.close()
            conn.close()
            
    return render_template("login.html")

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/confirm')
def confirm():
    if 'user_id' not in session:
        return redirect(url_for('signup'))
    return render_template('confirmation.html')

@app.route('/api/save_membership', methods=['POST'])
def save_membership():
    if 'user_id' not in session:
        return jsonify({
            'success': False, 
            'redirect': url_for('signup'),
            'message': 'Please login or create account to complete purchase'
        }), 401
    
    data = request.get_json()
    membership_id = session['user_id']
    
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO Memberships 
               (MembershipID, gym_name, membership_plan, start_date, end_date, ticket_type, total_price, payment_status) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, 'completed')""",
            (membership_id, data.get('gymName'), data.get('plan'), 
             data.get('startDate'), data.get('endDate'), 
             data.get('ticketType'), data.get('price'))
        )
        conn.commit()
        return jsonify({'success': True, 'membershipId': membership_id})
    finally:
        cur.close()
        conn.close()

@app.route('/api/check_session')
def check_session():
    if 'user_id' in session:
        return jsonify({
            'loggedIn': True,
            'user': {
                'membershipId': session['user_id'],
                'email': session.get('email'),
                'fname': session.get('fname')
            }
        })
    return jsonify({'loggedIn': False})

@app.context_processor
def inject_user():
    """Make user session and membership data available in all templates"""
    context = {'logged_in': False}
    
    if 'user_id' in session:
        conn = get_connection()
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute("SELECT * FROM Account WHERE MembershipID = %s", (session['user_id'],))
            user = cur.fetchone()
            
            if user:
                context.update({
                    'logged_in': True,
                    'user_id': user['MembershipID'],
                    'user_email': user['EMAIL'],
                    'user_fname': user['First_Name'],
                    'user_lname': user['Last_Name'],
                    'user_password': user['Password_Hash']  # Exposed plain text for display
                })
                
                # Fetch membership data
                membership = get_user_membership(session['user_id'])
                if membership:
                    context['user_membership'] = membership
        finally:
            cur.close()
            conn.close()
    
    return context

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)