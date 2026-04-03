@echo off
echo Iniciando Claude Code...
taskkill /F /IM python.exe 2>nul
cd /d C:\Dev\Trabajo\Printer-Logs-Analyzer
claude --dangerously-skip-permissions
