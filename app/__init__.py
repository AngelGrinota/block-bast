from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
bcrypt = Bcrypt()


def create_app():
    app = Flask(__name__, template_folder='templates', static_folder='static')
    app.config.from_object('config.Config')

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    bcrypt.init_app(app)

    login_manager.login_view = 'auth.login'

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
