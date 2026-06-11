# LSRW Main Setup

## Project parts

- `frontend`: React app
- `backend`: Express + Prisma + MySQL
- `ai-engine`: Python analysis scripts

## Prerequisites

- Node.js 18+
- Python 3.10+ with `python` available in PATH
- MySQL server

## 1. Configure backend env

From the project root:

```powershell
cd backend
Copy-Item .env.example .env
```

Update `backend/.env` with your values:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=Ram@3010
DB_NAME=lsrw
JWT_SECRET="change-me"
PORT=5000
```

Create the MySQL database first. Example name:

- `lsrw`

## 2. Install dependencies

Backend:

```powershell
cd backend
npm install
```

Frontend:

```powershell
cd frontend
npm install
```

Python AI engine:

```powershell
cd ai-engine
python -m pip install -r requirements.txt
python -m textblob.download_corpora
```

## 3. Prepare the database

Run these inside `backend`:

```powershell
cd backend
npm run db:generate
npm run db:migrate
npm run db:seed
```

## 4. Start the app

Use two terminals.

Terminal 1:

```powershell
cd backend
npm start
```

Terminal 2:

```powershell
cd frontend
npm start
```

Open:

- `http://localhost:3000`

Backend API default:

- `http://localhost:5000/api`

## Seeded users

After seeding, you can log in with:

- `admin@fluentpro.com` / `password123`
- `teacher@fluentpro.com` / `password123`
- `student@fluentpro.com` / `password123`

## Notes

- The backend calls Python with `python`, so `python --version` must work in your terminal.
- Speaking analysis uses the bundled `ffmpeg.exe` inside `ai-engine`.
- `language-tool-python` can take extra time on first run because it may download LanguageTool files.
- You only need `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, and `DB_NAME` in `.env`; the backend now builds the Prisma connection URL internally.
