@echo off
REM Quantum Noise Learning Lab — local preview launcher.
REM Double-click to start the Streamlit server and open the app in your default browser.

setlocal ENABLEDELAYEDEXPANSION

cd /d "%~dp0"

echo.
echo === Quantum Noise Learning Lab — local preview ===
echo Project dir: %CD%
echo.

REM --- Pick a Python interpreter --------------------------------------------
where py >nul 2>nul
if %ERRORLEVEL%==0 (
    set "PY=py -3"
) else (
    where python >nul 2>nul
    if %ERRORLEVEL%==0 (
        set "PY=python"
    ) else (
        echo [ERROR] No Python found on PATH. Install Python 3.10+ from https://www.python.org/downloads/
        pause
        exit /b 1
    )
)
echo Using Python: %PY%
%PY% --version

REM --- Make sure the package + UI deps are installed -----------------------
echo.
echo Checking dependencies...
%PY% -c "import streamlit, plotly, numpy, scipy, quantum_noise_lab" 1>nul 2>nul
if not %ERRORLEVEL%==0 (
    echo Installing missing dependencies into the current Python environment...
    %PY% -m pip install -e ".[all]"
    if not !ERRORLEVEL!==0 (
        echo [ERROR] pip install failed. Check the messages above.
        pause
        exit /b 1
    )
)

REM --- Pick a free port; fall back if 8501 is busy --------------------------
set "PORT=8501"
netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul
if %ERRORLEVEL%==0 (
    set "PORT=8765"
)
echo Using port: %PORT%

set "URL=http://localhost:%PORT%/"
echo Opening %URL% in your default browser when the server is ready...
echo.

REM --- Launch a tiny delayed browser open in the background ---------------
start "" /b cmd /c "timeout /t 4 /nobreak >nul & start "" "%URL%""

REM --- Run Streamlit (foreground so logs stay visible) ---------------------
%PY% -m streamlit run app/main.py --server.port %PORT% --server.address localhost --browser.gatherUsageStats false --server.headless true

echo.
echo Streamlit server stopped.
pause
endlocal
