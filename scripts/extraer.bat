@echo off
setlocal

if "%~1"=="" (
    echo Uso: extraer.bat [familia] [archivo_pdf]
    echo Ejemplo: extraer.bat E626xx "CPMD - 62655.pdf"
    exit /b 1
)

if "%~2"=="" (
    echo Error: Falta el nombre del archivo PDF.
    echo Uso: extraer.bat [familia] [archivo_pdf]
    exit /b 1
)

set FAMILY=%~1
set PDF=%~2
set OUTPUT=carga_%FAMILY%.sql

echo.
echo ==========================================
echo   CPMD Extractor (Generic Mode)
echo ==========================================
echo Familia: %FAMILY%
echo PDF:     %PDF%
echo Salida:  %OUTPUT%
echo ==========================================
echo.

python -m backend.scripts.ingest_cpmd --family "%FAMILY%" --pdf "%PDF%" --output-sql "%OUTPUT%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Proceso terminado con exito.
    echo [OK] SQL generado en: %OUTPUT%
) else (
    echo.
    echo [ERROR] Hubo un problema durante la extraccion.
)

pause
