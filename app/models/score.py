from datetime import datetime, timezone
from app import db
from sqlalchemy import UniqueConstraint


class Score(db.Model):
    __tablename__ = 'scores'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    difficulty = db.Column(db.String(16), nullable=False)  # 'beginner' | 'advanced' | 'hardcore'
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        UniqueConstraint('user_id', 'difficulty', name='uq_user_difficulty'),
    )

    user = db.relationship('User', backref='scores')

    def __repr__(self):
        return f'<Score {self.score} by user_id={self.user_id}>'
