from flask import Blueprint, render_template, request, jsonify, redirect, url_for
from flask_login import login_required, current_user
from app import db, limiter, csrf
from app.models.score import Score
from app.services.leaderboard_service import save_score, get_top_scores, get_score_history, get_top_scores_paginated, get_score_history_paginated

leaderboard_bp = Blueprint('leaderboard', __name__)


@leaderboard_bp.route('/leaderboard')
def leaderboard():
    difficulty = request.args.get('difficulty', '').strip() or None
    page = request.args.get('page', 1, type=int)
    mobile_param = request.args.get('mobile', None)

    # Если параметр mobile не задан, используем значение по умолчанию (ПК)
    # JavaScript на странице установит правильное значение при загрузке
    if mobile_param is None:
        mobile_param = 'false'

    # Определяем количество записей на страницу: 5 для мобильных, 10 для ПК
    per_page = 5 if mobile_param.lower() == 'true' else 10

    valid_difficulties = ('beginner', 'advanced', 'hardcore')

    if difficulty in valid_difficulties:
        # Пагинация для конкретной сложности
        pagination = get_top_scores_paginated(difficulty=difficulty, page=page, per_page=per_page)
        scores = pagination['scores']
        total_pages = pagination['pages']
        current_page = pagination['current_page']
        has_next = pagination['has_next']
        has_prev = pagination['has_prev']
        total_scores = pagination['total']
        section = difficulty
    else:
        # Пагинация для ALL (история всех попыток)
        pagination = get_score_history_paginated(difficulty=None, page=page, per_page=per_page)
        scores = pagination['scores']
        total_pages = pagination['pages']
        current_page = pagination['current_page']
        has_next = pagination['has_next']
        has_prev = pagination['has_prev']
        total_scores = pagination['total']
        section = 'all'

    return render_template('leaderboard.html',
                          scores=scores,
                          current_difficulty=difficulty,
                          section=section,
                          total_pages=total_pages,
                          current_page=current_page,
                          has_next=has_next,
                          has_prev=has_prev,
                          total_scores=total_scores,
                          per_page=per_page)


@leaderboard_bp.route('/api/scores', methods=['POST'])
@login_required
@limiter.limit("10 per minute")
@csrf.exempt
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
