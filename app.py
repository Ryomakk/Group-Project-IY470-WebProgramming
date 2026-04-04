from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('membership.html')

@app.route('/signup')
def signup():
    return render_template('signup.html')

@app.route('/confirm')
def confirm():
    return render_template('confirmation.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)