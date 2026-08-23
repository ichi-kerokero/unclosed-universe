@echo off
setlocal
set "APP_DIR=%~dp0"
set "CODEX_NODE=C:\Users\bokko\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "VITE_JS=%APP_DIR%node_modules\vite\bin\vite.js"

if not exist "%CODEX_NODE%" (
  echo Node.js が見つかりません。
  echo README.md の手順に従って Node.js と依存関係を準備してください。
  pause
  exit /b 1
)

if not exist "%VITE_JS%" (
  echo node_modules が見つかりません。
  echo このプロジェクトで pnpm install を実行してください。
  pause
  exit /b 1
)

start "閉じない宇宙 Server" /min "%CODEX_NODE%" "%VITE_JS%" --host 127.0.0.1 --port 4173
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:4173/"
endlocal
