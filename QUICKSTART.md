# ⚡ Быстрый старт BLOCK BLAST

## Установка за 5 минут

### 1. Установка зависимостей

```bash
# Создайте виртуальное окружение
python -m venv venv

# Активируйте
venv\Scripts\activate    # Windows
source venv/bin/activate # Linux/macOS

# Установите зависимости
pip install -r requirements.txt
```

### 2. Настройка

```bash
# Скопируйте .env.example в .env
copy .env.example .env    # Windows
cp .env.example .env      # Linux/macOS

# Сгенерируйте SECRET_KEY
python -c "import secrets; print(secrets.token_hex(32))"
```

Откройте `.env` и вставьте сгенерированный ключ:
```env
SECRET_KEY=ваш_ключ_из_32_символов
```

### 3. База данных

```bash
# Инициализируйте базу данных
flask db upgrade
```

### 4. Запуск

```bash
# Запустите приложение
flask run
```

Откройте http://127.0.0.1:5000 в браузере!

---

## 🎮 Первый запуск

1. **Зарегистрируйтесь** — нажмите SIGN UP в шапке
2. **Выберите сложность** — Beginner для начала
3. **Играйте** — перетаскивайте блоки на поле
4. **Смотрите рейтинг** — откройте LEADERBOARD

---

## 🔧 Если что-то пошло не так

**Ошибка SECRET_KEY:**
```bash
# Откройте .env и установите SECRET_KEY
```

**Проблемы с БД:**
```bash
# Удалите старую БД и создайте заново
del instance\blockbast.db    # Windows
rm instance/blockbast.db     # Linux/macOS
flask db upgrade
```

**Порт занят:**
```bash
# Запустите на другом порту
flask run --port 5001
```

---

## 📱 Мобильная версия

Откройте http://your-ip:5000 с телефона в той же Wi-Fi сети!

Для доступа извне добавьте в `.env`:
```env
FLASK_RUN_HOST=0.0.0.0
```

---

**Приятной игры! 🎮**
