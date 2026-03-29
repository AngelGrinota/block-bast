from flask import Flask, redirect
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from flask_wtf.csrf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
bcrypt = Bcrypt()
csrf = CSRFProtect()
limiter = Limiter(key_func=get_remote_address)


def create_app():
    app = Flask(__name__, template_folder='templates', static_folder='static')
    app.config.from_object('config.Config')

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    bcrypt.init_app(app)
    csrf.init_app(app)
    limiter.init_app(app)

    login_manager.login_view = 'auth.login'

    @login_manager.unauthorized_handler
    def unauthorized():
        from flask import request, jsonify
        if request.path.startswith('/api/'):
            return jsonify({'status': 'error', 'message': 'authentication required'}), 401
        return redirect(login_manager.login_view)

    with app.app_context():
        # Import models so SQLAlchemy registers them
        from app.models import user, score, score_history  # noqa: F401

        @login_manager.user_loader
        def load_user(user_id):
            from app.models.user import User
            return db.session.get(User, int(user_id))

        from app.routes.game import game_bp
        from app.routes.auth import auth_bp
        from app.routes.leaderboard import leaderboard_bp

        app.register_blueprint(game_bp)
        app.register_blueprint(auth_bp)
        app.register_blueprint(leaderboard_bp)

    return app
