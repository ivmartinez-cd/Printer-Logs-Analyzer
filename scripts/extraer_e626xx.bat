@echo off
echo Iniciando extraccion de CPMD para familia E626xx...
python -m backend.scripts.ingest_cpmd --family E626xx --pdf "CPMD - 62655.pdf" --output-sql "carga_cpmd_626xx.sql"
pause
