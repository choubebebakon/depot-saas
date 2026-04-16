@echo off
title Depot SaaS - Launcher
color 0A

echo ========================================
echo    DEPOT SAAS - NestJS + React
echo ========================================
echo.

:: -----------------------------------------------
:: VERIFICATION NODE MODULES BACKEND
:: -----------------------------------------------
echo [CHECK] Verification des dependances Backend...
if not exist "backend\node_modules" (
    echo [INSTALL] Installation des packages Backend...
    cd backend
    call npm install
    cd ..
)

:: -----------------------------------------------
:: VERIFICATION NODE MODULES FRONTEND
:: -----------------------------------------------
echo [CHECK] Verification des dependances Frontend...
if not exist "frontend-depot\node_modules" (
    echo [INSTALL] Installation des packages Frontend...
    cd frontend-depot
    call npm install
    cd ..
)

:: -----------------------------------------------
:: PRISMA - Generation du client
:: -----------------------------------------------
echo.
echo [PRISMA] Generation du client Prisma...
cd backend
call npx prisma generate
cd ..
echo [PRISMA] Client Prisma pret !

:: -----------------------------------------------
:: DEMARRAGE BACKEND NestJS
:: -----------------------------------------------
echo.
echo [1/2] Demarrage du Backend NestJS...
cd backend
start "BACKEND - NestJS" cmd /k "color 0B && echo === BACKEND NestJS === && npm run start:dev"
cd ..

:: Pause pour laisser NestJS demarrer avant le frontend
timeout /t 5 /nobreak > nul

:: -----------------------------------------------
:: DEMARRAGE FRONTEND React + Vite
:: -----------------------------------------------
echo [2/2] Demarrage du Frontend React/Vite...
cd frontend-depot
start "FRONTEND - React/Vite" cmd /k "color 0E && echo === FRONTEND React === && npm run dev"
cd ..

:: -----------------------------------------------
:: RECAPITULATIF
:: -----------------------------------------------
echo.
echo ========================================
echo   Serveurs lances avec succes !
echo.
echo   Backend  NestJS : http://localhost:3000
echo   Frontend React  : http://localhost:5173
echo   Prisma Studio   : npx prisma studio
echo ========================================
echo.
echo   Ferme les fenetres CMD pour tout arreter.
echo.
pause