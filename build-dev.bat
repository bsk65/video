@echo off
setlocal
echo === Skydevideo TEST-BUILD ===
echo Bygger til /video-dev/ (IKKE produktion)

set PROJ=%~dp0
set PROJ=%PROJ:~0,-1%

REM Brug altid index.src.html som kilde
copy "%PROJ%\index.src.html" "%PROJ%\index.html" /Y >nul 2>&1

REM Byg med dev-konfiguration
call npx vite build --config vite.config.dev.js
if errorlevel 1 (
  echo FEJL: Build fejlede!
  pause
  exit /b 1
)

REM Kopier build til video-dev mappe (ryd assets foerst saa gamle filer ikke akkumulerer)
if not exist "%PROJ%\video-dev" mkdir "%PROJ%\video-dev"
if exist "%PROJ%\video-dev\assets" rmdir /S /Q "%PROJ%\video-dev\assets"
xcopy "%PROJ%\dist-dev\*" "%PROJ%\video-dev\" /E /Y /Q

REM Brug git worktree saa vi ikke behover at skifte branch og miste dette script.
set TMPWT=%TEMP%\video-main-worktree-%RANDOM%%RANDOM%
if exist "%TMPWT%" (
  git worktree remove "%TMPWT%" --force >nul 2>&1
)

git worktree add "%TMPWT%" main
if errorlevel 1 (
  echo FEJL: Kunne ikke oprette worktree for main!
  pause
  exit /b 1
)

if not exist "%TMPWT%\video-dev" mkdir "%TMPWT%\video-dev"

REM Ryd gamle assets i worktree FOERST - se 3D-appens build-dev.bat for baggrunden
del "%TMPWT%\video-dev\assets\index-*.js" >nul 2>&1
del "%TMPWT%\video-dev\assets\index-*.css" >nul 2>&1

xcopy "%PROJ%\video-dev\assets\*" "%TMPWT%\video-dev\assets\" /E /Y /Q
if exist "%PROJ%\video-dev\icons" xcopy "%PROJ%\video-dev\icons\*" "%TMPWT%\video-dev\icons\" /E /Y /Q

for %%F in ("%PROJ%\video-dev\*.html") do (
  if /I not "%%~nxF"=="index.html" copy "%%F" "%TMPWT%\video-dev\%%~nxF" /Y >nul
)

copy "%PROJ%\video-dev\index.html" "%TMPWT%\video-dev\index.html" /Y
if errorlevel 1 (
  echo FEJL: Kunne ikke kopiere video-dev/index.html!
  pause
  exit /b 1
)

REM sw.js og manifest.json ligger i public/ og bliver kopieret uaendret af
REM Vite til dist-dev-roden (ikke en del af assets/, og bevidst UHASHET
REM saa manifestets relative stier peger rigtigt her i video-dev/ og ikke
REM paa produktionens rod) - skal derfor kopieres eksplicit.
if exist "%PROJ%\video-dev\sw.js" copy "%PROJ%\video-dev\sw.js" "%TMPWT%\video-dev\sw.js" /Y >nul
if exist "%PROJ%\video-dev\manifest.json" copy "%PROJ%\video-dev\manifest.json" "%TMPWT%\video-dev\manifest.json" /Y >nul

powershell -NoProfile -ExecutionPolicy Bypass -File "%PROJ%\verify-build.ps1" -Html "%TMPWT%\video-dev\index.html" -AssetsDir "%TMPWT%\video-dev\assets"
if errorlevel 1 (
  echo FEJL: video-dev/index.html og assets/ er ikke i sync - build-dev.bat afbrudt.
  pause
  exit /b 1
)

cd /d "%TMPWT%"

git rm --cached --quiet video-dev/index.html >nul 2>&1

git add video-dev/
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Test-build opdatering [video-dev]"

  git show HEAD:video-dev/index.html > "%TMPWT%\_verify_index.html" 2>nul
  powershell -NoProfile -ExecutionPolicy Bypass -File "%PROJ%\verify-build.ps1" -Html "%TMPWT%\_verify_index.html" -AssetsDir "%TMPWT%\video-dev\assets"
  if errorlevel 1 (
    echo.
    echo FEJL: Det COMMITTEDE indhold er ikke i sync - push afbrudt!
    echo Commit'en er lokal i %TMPWT% og er IKKE pushet til GitHub.
    echo Ret manuelt eller kontakt Claude med denne besked.
    echo.
    pause
    exit /b 1
  )
  del "%TMPWT%\_verify_index.html" >nul 2>&1

  git push origin main
  echo.
  echo === Faerdig! Test-appen er live om 1-2 min ===
  echo === URL: https://bsk65.github.io/video/video-dev/   ===
  echo.
) else (
  echo === Ingen aendringer at pushe ===
)

cd /d "%PROJ%"
git worktree remove "%TMPWT%" --force >nul 2>&1

pause
