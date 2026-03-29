from datetime import datetime, timezone
from app import db
from app.models.score import Score
from app.models.score_history import ScoreHistory
from app.models.user import User


def save_score(user_id: int, score_val: int, difficulty: str) -> bool:
    """
    Upsert best score per user per difficulty.

    - Always inserts a new ScoreHistory row (full attempt history).
    - If no existing Score record: create a new one, return True.
    - If existing Score record and new score is higher: update score + updated_at, return True.
    - If existing Score record and new score is not higher: do nothing, return False.
    Both the history insert and the upsert are committed in the same transaction.
    """
    try:
        # Always record the attempt in history
        history_entry = ScoreHistory(user_id=user_id, score=score_val, difficulty=difficulty)
        db.session.add(history_entry)

        existing = (
            db.session.query(Score)
            .filter_by(user_id=user_id, difficulty=difficulty)
            .one_or_none()
        )

        updated = False

        if existing is None:
            entry = Score(user_id=user_id, score=score_val, difficulty=difficulty)
            db.session.add(entry)
            updated = True
        elif score_val > existing.score:
            existing.score = score_val
            existing.updated_at = datetime.now(timezone.utc)
            updated = True

        db.session.commit()
        return updated
    except Exception as e:
        db.session.rollback()
        return False


def get_score_history(difficulty: str = None, limit: int = 100) -> list:
    """
    Return all score attempts ordered by created_at descending (full history).
    Optionally filtered by difficulty.
    Each entry: {rank, username, score, difficulty, created_at}
    """
    query = (
        db.session.query(ScoreHistory, User.username)
        .join(User, ScoreHistory.user_id == User.id)
        .order_by(ScoreHistory.created_at.desc())
    )

    if difficulty:
        query = query.filter(ScoreHistory.difficulty == difficulty)

    rows = query.limit(limit).all()

    result = []
    for rank, (history_obj, username) in enumerate(rows, start=1):
        result.append({
            'rank': rank,
            'username': username,
            'score': history_obj.score,
            'difficulty': history_obj.difficulty,
            'date': history_obj.created_at.strftime('%Y-%m-%d %H:%M'),
        })

    return result


def get_top_scores(difficulty: str = None, limit: int = 50) -> list:
    """
    Return top scores ordered by score descending.
    Optionally filtered by difficulty.
    With one row per user per difficulty (enforced by UniqueConstraint),
    no GROUP BY is needed — a simple ORDER BY score DESC is correct.
    Each entry: {rank, username, score, difficulty, updated_at}
    """
    query = (
        db.session.query(Score, User.username)
        .join(User, Score.user_id == User.id)
        .order_by(Score.score.desc())
    )

    if difficulty:
        query = query.filter(Score.difficulty == difficulty)

    rows = query.limit(limit).all()

    result = []
    for rank, (score_obj, username) in enumerate(rows, start=1):
        result.append({
            'rank': rank,
            'username': username,
            'score': score_obj.score,
            'difficulty': score_obj.difficulty,
            'date': score_obj.updated_at.strftime('%Y-%m-%d %H:%M'),
        })

    return result


def get_top_scores_paginated(difficulty: str = None, page: int = 1, per_page: int = 15) -> dict:
    """
    Return paginated top scores ordered by score descending.
    Optionally filtered by difficulty.
    Returns: { scores: [...], total: int, pages: int, current_page: int, has_next: bool, has_prev: bool }
    """
    base_query = (
        db.session.query(Score, User.username)
        .join(User, Score.user_id == User.id)
    )

    if difficulty:
        base_query = base_query.filter(Score.difficulty == difficulty)

    # Get total count before ordering
    total = base_query.count()
    
    pages = (total + per_page - 1) // per_page  # ceiling division
    current_page = max(1, min(page, pages)) if pages > 0 else 1

    offset = (current_page - 1) * per_page
    rows = base_query.order_by(Score.score.desc()).offset(offset).limit(per_page).all()

    result = []
    for rank, (score_obj, username) in enumerate(rows, start=1 + offset):
        result.append({
            'rank': rank,
            'username': username,
            'score': score_obj.score,
            'difficulty': score_obj.difficulty,
            'date': score_obj.updated_at.strftime('%Y-%m-%d %H:%M'),
        })

    return {
        'scores': result,
        'total': total,
        'pages': pages,
        'current_page': current_page,
        'has_next': current_page < pages,
        'has_prev': current_page > 1,
    }


def get_score_history_paginated(difficulty: str = None, page: int = 1, per_page: int = 15) -> dict:
    """
    Return paginated score history ordered by created_at descending.
    Optionally filtered by difficulty.
    Returns: { scores: [...], total: int, pages: int, current_page: int, has_next: bool, has_prev: bool }
    """
    base_query = (
        db.session.query(ScoreHistory, User.username)
        .join(User, ScoreHistory.user_id == User.id)
    )

    if difficulty:
        base_query = base_query.filter(ScoreHistory.difficulty == difficulty)

    # Get total count before ordering
    total = base_query.count()
    
    pages = (total + per_page - 1) // per_page  # ceiling division
    current_page = max(1, min(page, pages)) if pages > 0 else 1

    offset = (current_page - 1) * per_page
    rows = base_query.order_by(ScoreHistory.created_at.desc()).offset(offset).limit(per_page).all()

    result = []
    for rank, (history_obj, username) in enumerate(rows, start=1 + offset):
        result.append({
            'rank': rank,
            'username': username,
            'score': history_obj.score,
            'difficulty': history_obj.difficulty,
            'date': history_obj.created_at.strftime('%Y-%m-%d %H:%M'),
        })

    return {
        'scores': result,
        'total': total,
        'pages': pages,
        'current_page': current_page,
        'has_next': current_page < pages,
        'has_prev': current_page > 1,
    }
