@echo off
cd /d "C:\Users\rotat\OneDrive\Área de Trabalho\Pindorama\pindorama-prospecting"
echo [%date% %time%] >> dashboard-log.txt
node metrics.mjs >> dashboard-log.txt 2>&1
echo. >> dashboard-log.txt
echo ---------------------------------------- >> dashboard-log.txt
