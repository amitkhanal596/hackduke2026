@echo off
echo Starting Toro Frontend...
cd frontend

if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

echo Starting Next.js development server...
call npm run dev
