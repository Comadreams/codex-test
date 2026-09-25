@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto missing_node
where npm >nul 2>nul
if errorlevel 1 goto missing_node
node -e "const v=process.versions.node.split('.').map(Number);process.exit(v[0]>20||v[0]===20&&v[1]>=9?0:1)"
if errorlevel 1 goto old_node

if not exist node_modules (
  echo Preparing the storyboard. This may take a minute the first time.
  call npm ci
  if errorlevel 1 goto failed
)

echo Starting the storyboard in a separate window.
start "Storyboard server" /D "%~dp0" cmd /k npm run dev
timeout /t 10 /nobreak >nul
start "" "http://localhost:3000"
echo Keep the Storyboard server window open while you use the board.
pause
exit /b 0

:missing_node
echo This computer needs Node.js before the storyboard can run.
echo Install it from https://nodejs.org/en/download and double-click this file again.
pause
exit /b 1

:old_node
echo This version of the storyboard needs Node.js 20.9 or newer.
echo Update Node.js at https://nodejs.org/en/download and double-click this file again.
pause
exit /b 1

:failed
echo The storyboard could not be prepared. Please share a screenshot of this window.
pause
exit /b 1
