@echo off
setlocal
echo === Skydevideo PROD-BUILD ===
echo Bygger til produktion (main-branch)

set PROJ=%~dp0
set PROJ=%PROJ:~0,-1%

REM Brug altid index.src.html som kilde til Vite
copy "%PROJ%\index.src.html" "%PROJ%\index.html" /Y >nul 2>&1

REM Byg med Vite
call npm run build
if errorlevel 1 (
  echo FEJL: Build fejlede!
  pause
  exit /b 1
)

REM Brug git worktree saa vi ikke behover at skifte branch.
REM Placeres i %TEMP% (IKKE ved siden af projektet) fordi projektmappen
REM ligger under OneDrive-synkronisering: naar "git worktree add" skriver
REM tusindvis af filer paa en gang, kan OneDrive naa at gribe ind i den
REM efterfoelgende index.html-kopiering og stille og roligt revertere den
REM til en gammel version foer "git commit" naar at se den - se 3D-appens
REM build.bat, hvor dette gav en produktions-bug.
set TMPWT=%TEMP%\video-prod-worktree-%RANDOM%%RANDOM%
if exist "%TMPWT%" (
  git worktree remove "%TMPWT%" --force >nul 2>&1
)

git worktree add "%TMPWT%" main
if errorlevel 1 (
  echo FEJL: Kunne ikke oprette worktree for main!
  pause
  exit /b 1
)

REM Ryd gamle assets i worktree
del "%TMPWT%\assets\index-*.js" >nul 2>&1
del "%TMPWT%\assets\index-*.css" >nul 2>&1

REM Kopier byggede filer til worktree
xcopy "%PROJ%\dist\assets\*" "%TMPWT%\assets\" /E /Y /Q
if exist "%PROJ%\dist\icons" xcopy "%PROJ%\dist\icons\*" "%TMPWT%\icons\" /E /Y /Q

REM Statiske rod-sider (udover index.html) kopieres uaendret med, hvis der
REM nogensinde tilfoejes en - se 3D-appens build.bat for baggrunden.
for %%F in ("%PROJ%\dist\*.html") do (
  if /I not "%%~nxF"=="index.html" copy "%%F" "%TMPWT%\%%~nxF" /Y >nul
)

copy "%PROJ%\dist\index.html" "%TMPWT%\index.html" /Y
if errorlevel 1 (
  echo FEJL: Kunne ikke kopiere index.html!
  pause
  exit /b 1
)

REM sw.js og manifest.json ligger i public/ og bliver kopieret uaendret af
REM Vite til dist-roden (ikke en del af assets/, og bevidst UHASHET saa
REM manifestets relative ikon-/start_url-stier peger rigtigt uanset om
REM appen koeres fra produktion eller video-dev) - skal derfor kopieres
REM eksplicit, ligesom index.html.
if exist "%PROJ%\dist\sw.js" copy "%PROJ%\dist\sw.js" "%TMPWT%\sw.js" /Y >nul
if exist "%PROJ%\dist\manifest.json" copy "%PROJ%\dist\manifest.json" "%TMPWT%\manifest.json" /Y >nul

REM Sikkerhedstjek: bekraeft at index.html rent faktisk peger paa en
REM JS-fil der findes i assets/, foer vi committer noget som helst.
powershell -NoProfile -ExecutionPolicy Bypass -File "%PROJ%\verify-build.ps1" -Html "%TMPWT%\index.html" -AssetsDir "%TMPWT%\assets"
if errorlevel 1 (
  echo FEJL: index.html og assets/ er ikke i sync - build.bat afbrudt for at undgaa en 404-produktion.
  pause
  exit /b 1
)

REM Commit og push fra main worktree
cd /d "%TMPWT%"

REM Fjern index.html fra git-indekset foer re-tilfoejelse - tvinger git til at
REM lase indholdet friskt fra disk fremfor at stole paa cachet mtime/size
REM ("racy git") - se 3D-appens build.bat for baggrunden.
git rm --cached --quiet index.html >nul 2>&1

git add *.html assets/ css/style.css icons/ sw.js manifest.json
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Prod-build opdatering"

  REM Efter-commit sikkerhedstjek: bekraeft at det FAKTISK COMMITTEDE
  REM indhold (ikke bare arbejdstraeets filer foer commit) er i sync.
  git show HEAD:index.html > "%TMPWT%\_verify_index.html" 2>nul
  powershell -NoProfile -ExecutionPolicy Bypass -File "%PROJ%\verify-build.ps1" -Html "%TMPWT%\_verify_index.html" -AssetsDir "%TMPWT%\assets"
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
  echo === Faerdig! Appen er live om 1-2 min ===
  echo === URL: https://bsk65.github.io/video/ ===
  echo.
) else (
  echo === Ingen aendringer at pushe ===
)

REM Ryd worktree op og vend tilbage
cd /d "%PROJ%"
git worktree remove "%TMPWT%" --force >nul 2>&1

pause
