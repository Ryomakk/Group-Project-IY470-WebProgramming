"""
Papi Gym - Flask Application
Membership management system with MySQL backend
"""

# ============================================
# FLASK IMPORTS & CONFIGURATION
# ============================================

# Core Flask imports for web framework functionality
from flask import Flask, request, render_template, url_for, redirect, session, jsonify

# Environment variable management for secure configuration (DB credentials, secret keys)
from dotenv import load_dotenv

# Load environment variables from key.env file immediately
load_dotenv("key.env")

# MySQL database connector for Python
import mysql.connector

# Utilities for generating random membership IDs
import random
import string

# Operating system interface for reading environment variables
import os


# ============================================
# FLASK APP INITIALIZATION
# ============================================

# Create Flask application instance
app = Flask(__name__)

# Session security key loaded from environment variables
# Used to encrypt session cookies and protect against tampering
app.secret_key = os.getenv("SECRET_KEY")   #protect sessions ex cookie



# ============================================
# DATABASE CONFIGURATION
# ============================================

# Database connection parameters loaded from environment variables
# Allows configuration without hardcoding credentials in source code
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),           # Database server address (e.g., localhost)
    "user": os.getenv("DB_USER"),           # MySQL username (e.g., root)
    "password": os.getenv("DB_PASSWORD"),   # MySQL password
    "database": os.getenv("DB_NAME"),       # Database name (e.g., papigym_db)
    "raise_on_warnings": True,              # Raise exceptions on MySQL warnings
}

def get_connection():
    """
    Database Connection Factory
    Creates and returns a new MySQL connection using DB_CONFIG
    Called by all database operations to ensure consistent connections
    """
    return mysql.connector.connect(**DB_CONFIG)


# ============================================
# UTILITY FUNCTIONS
# ============================================

def generate_membership_id():
    """
    Membership ID Generator
    Generates unique 6-digit numeric ID (e.g., "482910")
    Checks database to ensure no duplicates exist
    Returns: str - 6-digit membership ID
    """
    conn = get_connection()
    try:
        cur = conn.cursor()
        # Keep generating until unique ID found
        while True:
            # Generate 6 random digits
            new_id = ''.join(random.choices(string.digits, k=6))
            # Check if ID already exists in Account table
            cur.execute("SELECT 1 FROM Account WHERE MembershipID = %s", (new_id,))
            if not cur.fetchone():
                return new_id
    finally:
        # Ensure resources are released even if error occurs
        cur.close()
        conn.close()

def get_user_membership(membership_id):
    """
    Fetch User Membership Details
    Retrieves the most recent active membership for a given user
    Args: membership_id (str) - 6-digit member ID
    Returns: dict - Membership record or None
    """
    conn = get_connection()
    try:
        cur = conn.cursor(dictionary=True)  # Returns results as dictionaries
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


# ============================================
# ROUTE: HOME/INDEX
# ============================================

@app.route("/")
def index():
    """
    Landing Page Route
    Root URL handler - displays main homepage
    Template: index.html
    """
    return render_template('index.html')


# ============================================
# ROUTE: MEMBERSHIP PAGE (PROTECTED)
# ============================================

@app.route('/membership')
def membership():
    """
    Membership Selection Page
    Requires user to be logged in
    If not authenticated: redirects to signup and stores intended URL
    If authenticated: displays membership comparison/selection interface
    """
    if 'user_id' not in session:
        # Store intended destination for post-login redirect
        session['next_url'] = url_for('membership')
        return redirect(url_for('signup'))
    return render_template('membership.html')


# ============================================
# ROUTE: USER REGISTRATION
# ============================================

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    """
    User Registration Handler
    GET: Display registration form (signup.html)
    POST: Process form submission, create new account

    Form Fields Expected:
        - email: User email address
        - fname: First name
        - Lname: Last name (note: capital L)
        - pass_word: Password field

    Generates: Unique 6-digit MembershipID
    Stores: Plain text password (NOTE: Not secure for production)
    """
    if request.method == 'POST':
        # Extract and clean form data
        email = request.form.get("email", "").strip()
        fname = request.form.get("fname", "").strip()
        lname = request.form.get("Lname", "").strip()
        password = request.form.get("pass_word", "").strip()

        # Validation: Ensure all required fields present
        if not all([email, fname, lname, password]):
            return "Missing required fields", 400

        conn = get_connection()
        try:
            cur = conn.cursor()
            # Check for existing email to prevent duplicates
            cur.execute("SELECT 1 FROM Account WHERE EMAIL = %s LIMIT 1", (email,))
            if cur.fetchone():
                return render_template("message.html", 
                                    message="Email already registered!", 
                                    redirect_url=url_for("signup"))

            # Generate unique identifier for new account
            membership_id = generate_membership_id()

            # PLAIN TEXT STORAGE - No password hashing implemented
            # SECURITY NOTE: This stores passwords in readable format
            plain_password = password

            # Insert new account into database
            cur.execute(
                """INSERT INTO Account (EMAIL, First_Name, Last_Name, MembershipID, Password_Hash) 
                   VALUES (%s, %s, %s, %s, %s)""",
                (email, fname, lname, membership_id, plain_password)
            )
            conn.commit()

            # Display success page with new Membership ID
            return render_template('signup.html', membership_id=membership_id)

        finally:
            # Cleanup database resources
            cur.close()
            conn.close()

    # GET request - show empty registration form
    return render_template('signup.html')


# ============================================
# ROUTE: USER LOGIN
# ============================================

@app.route("/login", methods=['GET', 'POST'])
def account_page():
    """
    User Login Handler
    GET: Display login form (login.html)
    POST: Authenticate user and establish session

    Login Methods Supported:
        - Email address (contains '@')
        - Membership ID (6-digit number)

    Session Variables Set:
        - user_id: MembershipID
        - email: User email
        - fname: First name
        - lname: Last name
    """
    if request.method == 'POST':
        identifier = request.form.get("membership", "").strip()
        password = request.form.get("pass_word", "").strip()

        conn = get_connection()
        try:
            cur = conn.cursor(dictionary=True)

            # Determine lookup method based on input format
            if '@' in identifier:
                # Lookup by email address
                cur.execute("SELECT * FROM Account WHERE EMAIL = %s", (identifier,))
            else:
                # Lookup by membership ID
                cur.execute("SELECT * FROM Account WHERE MembershipID = %s", (identifier,))

            user = cur.fetchone()

            # PLAIN TEXT COMPARISON - Direct string match
            # SECURITY NOTE: Compares raw passwords without hashing
            if user and user['Password_Hash'] == password:
                # Establish user session
                session['user_id'] = user['MembershipID']
                session['email'] = user['EMAIL']
                session['fname'] = user['First_Name']
                session['lname'] = user['Last_Name']

                # Redirect to originally requested page if exists
                next_url = session.pop('next_url', None)
                if next_url:
                    return redirect(next_url)
                return redirect(url_for('index'))
            else:
                # Authentication failed
                return render_template("message.html", 
                                    message="Invalid credentials!", 
                                    redirect_url=url_for("account_page"))
        finally:
            cur.close()
            conn.close()

    # GET request - show login form
    return render_template("login.html")


# ============================================
# ROUTE: LOGOUT
# ============================================

@app.route('/logout')
def logout():
    """
    Session Termination
    Clears all session data and redirects to homepage
    """
    session.clear()
    return redirect(url_for('index'))


# ============================================
# ROUTE: CONFIRMATION PAGE
# ============================================

@app.route('/confirm')
def confirm():
    """
    Purchase Confirmation Page
    Displays after successful membership purchase
    Requires active session
    """
    if 'user_id' not in session:
        return redirect(url_for('signup'))
    return render_template('confirmation.html')


# ============================================
# API: SAVE MEMBERSHIP (AJAX ENDPOINT)
# ============================================

@app.route('/api/save_membership', methods=['POST'])
def save_membership():
    """
    Membership Purchase API
    Accepts JSON data from frontend JavaScript
    Creates Membership record in database

    Expected JSON Payload:
        {
            "gymName": "uGym" or "powerZone",
            "plan": "tier name",
            "startDate": "YYYY-MM-DD",
            "endDate": "YYYY-MM-DD", 
            "ticketType": "membership type",
            "price": decimal amount
        }

    Returns JSON:
        - Success: {"success": True, "membershipId": "123456"}
        - Auth Error: {"success": False, "redirect": "...", "message": "..."}
    """
    if 'user_id' not in session:
        return jsonify({
            'success': False, 
            'redirect': url_for('signup'),
            'message': 'Please login or create account to complete purchase'
        }), 401  # HTTP 401 Unauthorized

    data = request.get_json()
    membership_id = session['user_id']

    conn = get_connection()
    try:
        cur = conn.cursor()
        # Insert membership purchase record
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


# ============================================
# API: SESSION STATUS CHECK
# ============================================

@app.route('/api/check_session')
def check_session():
    """
    Session Validation API
    Called by JavaScript to check if user is logged in
    Returns user data if authenticated

    Returns JSON:
        - Logged in: {"loggedIn": True, "user": {...}}
        - Guest: {"loggedIn": False}
    """
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


# ============================================
# CONTEXT PROCESSOR (TEMPLATE GLOBALS)
# ============================================

@app.context_processor
def inject_user():
    """
    Template Context Injector
    Makes user data available to ALL templates automatically

    Variables Available in Templates:
        - logged_in: Boolean session status
        - user_id: 6-digit membership ID
        - user_email: Email address
        - user_fname: First name
        - user_lname: Last name
        - user_password: Plain text password (exposed)
        - user_membership: Active membership details (if exists)

    Called automatically before each template render
    """
    context = {'logged_in': False}

    if 'user_id' in session:
        conn = get_connection()
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute("SELECT * FROM Account WHERE MembershipID = %s", (session['user_id'],))
            user = cur.fetchone()

            if user:
                # Populate context with user details
                context.update({
                    'logged_in': True,
                    'user_id': user['MembershipID'],
                    'user_email': user['EMAIL'],
                    'user_fname': user['First_Name'],
                    'user_lname': user['Last_Name'],
                    'user_password': user['Password_Hash']  # Exposed plain text for display
                })

                # Fetch and add membership data if exists
                membership = get_user_membership(session['user_id'])
                if membership:
                    context['user_membership'] = membership
        finally:
            cur.close()
            conn.close()

    return context


# ============================================
# APPLICATION ENTRY POINT
# ============================================

if __name__ == "__main__":
    """
    Development Server Startup
    Accessible on all network interfaces (0.0.0.0)
    Port 5001 (avoids conflict with default 5000 on some systems)
    Debug mode enabled for auto-reload on code changes
    """
    app.run(host="0.0.0.0", port=5001, debug=True)