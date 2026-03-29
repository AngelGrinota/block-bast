from flask import Blueprint, render_template, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models.score import Score
from app.services.leaderboard_service import save_score, get_top_scores, get_score_history

leaderboard_bp = Blueprint('leaderboard', __name__)


@leaderboard_bp.route('/leaderboard')
def leaderboard():
    difficulty = request.args.get('difficulty', '').strip() or None
    valid_difficulties = ('beginner', 'advanced', 'hardcore')
    if difficulty in valid_difficulties:
        scores = get_top_scores(difficulty=difficulty, limit=50)
        section = difficulty
    else:
        scores = get_score_history(difficulty=None, limit=100)
        section = 'all'
    return render_template('leaderboard.html', scores=scores, current_difficulty=difficulty, section=section)


@leaderboard_bp.route('/api/scores', methods=['POST'])
def post_score():
    if not current_user.is_authenticated:
        return jsonify({'status': 'error', 'message': 'authentication required'}), 401

    data = request.get_json(force=True, silent=True) or {}
    score_val = data.get('score')
    difficulty = data.get('difficulty')

    if score_val is None or difficulty is None:
        return jsonify({'status': 'error', 'message': 'score and difficulty are required'}), 400

    valid_difficulties = ('beginner', 'advanced', 'hardcore')
    if difficulty not in valid_difficulties:
        return jsonify({'status': 'error', 'message': 'invalid difficulty'}), 400

    try:
        score_int = int(score_val)
    except (TypeError, ValueError):
        return jsonify({'status': 'error', 'message': 'score must be an integer'}), 400

    if not (0 <= score_int <= 10_000_000):
        return jsonify({'status': 'error', 'message': 'score out of range'}), 400

    updated = save_score(user_id=current_user.id, score_val=score_int, difficulty=difficulty)

    # Build enriched response: player rank via COUNT (works at any rank), top 10 leaderboard
    player_entry = (
        db.session.query(Score)
        .filter_by(user_id=current_user.id, difficulty=difficulty)
        .first()
    )
    player_rank = None
    player_best = None
    if player_entry:
        player_best = player_entry.score
        higher_count = (
            db.session.query(db.func.count(Score.id))
            .filter(Score.difficulty == difficulty, Score.score > player_best)
            .scalar()
        )
        player_rank = higher_count + 1

    leaderboard_top10 = get_top_scores(difficulty=difficulty, limit=10)

    return jsonify({
        'status': 'ok',
        'updated': updated,
        'player_rank': player_rank,
        'player_best': player_best,
        'leaderboard': leaderboard_top10,
    })


@leaderboard_bp.route('/api/best-score', methods=['GET'])
def best_score():
    """Return the global best (max) score across all users for a given difficulty."""
    difficulty = request.args.get('difficulty', '').strip() or None

    if not difficulty:
        return jsonify({'best': None})

    best = (
        db.session.query(db.func.max(Score.score))
        .filter(Score.difficulty == difficulty)
        .scalar()
    )

    return jsonify({'best': best})
