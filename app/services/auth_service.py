from app import db, bcrypt
from app.models.user import User


def register_user(username: str, password: str):
    """Register a new user. Returns User on success, None if username is taken."""
    if User.query.filter_by(username=username).first():
        return None

    password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    user = User(username=username, password_hash=password_hash)
    db.session.add(user)
    db.session.commit()
    return user


def verify_user(username: str, password: str):
    """Verify credentials. Returns User on success, None on failure."""
    user = User.query.filter_by(username=username).first()
    if user is None:
        return None
    if not bcrypt.check_password_hash(user.password_hash, password):
        return None
    return user
