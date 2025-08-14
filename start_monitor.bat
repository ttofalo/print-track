@echo off
echo ========================================
echo    MONITOR AUTOMATICO DE LOGS CUPS
echo ========================================
echo.
echo Iniciando monitoreo cada 10 minutos...
echo Presiona Ctrl+C para detener
echo.

cd /d "%~dp0"
python auto_monitor.py

pause 