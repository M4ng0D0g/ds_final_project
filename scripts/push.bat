@echo off
setlocal

set "REMOTE_URL=https://github.com/M4ng0D0g/ds_final_project.git"
set "BRANCH=main"
set "VERSION_FILE=.settings"
set "USER_MSG=%*"

if "%~1"=="" (
  echo Usage: push.bat "commit message"
  exit /b 1
)

if not exist "%VERSION_FILE%" (
  echo Error: .settings file not found in project root.
  exit /b 1
)

set "VERSION="
for /f "usebackq tokens=* delims=" %%i in ("%VERSION_FILE%") do (
  set "VERSION=%%i"
  goto :version_loaded
)

:version_loaded
if "%VERSION%"=="" (
  echo Error: .settings file is empty.
  exit /b 1
)

set "COMMIT_MSG=v%VERSION%: %USER_MSG%"

if "%DRY_RUN%"=="1" (
  echo DRY_RUN: computed commit message -> %COMMIT_MSG%
  endlocal
  exit /b 0
)

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo Error: this directory is not a git repository.
  exit /b 1
)

git remote get-url origin >nul 2>&1
if errorlevel 1 (
  git remote add origin %REMOTE_URL%
) else (
  git remote set-url origin %REMOTE_URL%
)

git add -A
git diff --cached --quiet >nul 2>&1

if %errorlevel%==0 (
  echo No changes to commit.
  exit /b 0
)

if %errorlevel% GEQ 2 (
  echo Error: unable to check staged changes.
  exit /b 1
)

git commit -m "%COMMIT_MSG%"
git push -u origin %BRANCH%

endlocal
