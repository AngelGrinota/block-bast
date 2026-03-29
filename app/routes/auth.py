from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required
from app.services.auth_service import register_user, verify_user

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        confirm = request.form.get('confirm_password', '')

        if not username:
            flash('Username is required.', 'error')
            return render_template('register.html')
        if len(username) > 20:
            flash('Username must be 20 characters or fewer.', 'error')
            return render_template('register.html')
        if len(password) < 8:
            flash('Password must be at least 8 characters.', 'error')
            return render_template('register.html')
        if password != confirm:
            flash('Passwords do not match.', 'error')
            return render_template('register.html')

        user = register_user(username, password)
        if user is None:
            flash('Username already taken.', 'error')
            return render_template('register.html')

        login_user(user)
        return redirect(url_for('game.index'))

    return render_template('register.html')


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')

        if not username:
            flash('Username is required.', 'error')
            return render_template('login.html')
        if not password:
            flash('Password is required.', 'error')
            return render_template('login.html')

        user = verify_user(username, password)
        if user is None:
            flash('Invalid username or password.', 'error')
            return render_template('login.html')

        login_user(user)
        return redirect(url_for('game.index'))

    return render_template('login.html')


@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return redirect(url_for('game.index'))
