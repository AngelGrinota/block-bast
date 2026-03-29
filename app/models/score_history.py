from datetime import datetime, timezone
from app import db


class ScoreHistory(db.Model):
    __tablename__ = 'score_history'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    difficulty = db.Column(db.String(16), nullable=False)  # 'beginner' | 'advanced' | 'hardcore'
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    user = db.relationship('User', backref='score_history')

    def __repr__(self):
        return f'<ScoreHistory {self.score} by user_id={self.user_id} at {self.created_at}>'
