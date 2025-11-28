@echo off
REM Inicia backend en puerto 3001
CALL node server/server.js
REM Inicia frontend en puerto 3000
CALL npm run dev
