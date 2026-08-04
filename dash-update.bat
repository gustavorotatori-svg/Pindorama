@echo off
cd /d "C:\Users\rotat\OneDrive\Área de Trabalho\Pindorama\pindorama-prospecting"
echo [%date% %time%] >> "C:\Users\rotat\OneDrive\Área de Trabalho\Pindorama\pindorama-prospecting\dash-log.txt"
node metrics.mjs >> "C:\Users\rotat\OneDrive\Área de Trabalho\Pindorama\pindorama-prospecting\dash-log.txt" 2>&1
echo. >> "C:\Users\rotat\OneDrive\Área de Trabalho\Pindorama\pindorama-prospecting\dash-log.txt"
echo --- >> "C:\Users\rotat\OneDrive\Área de Trabalho\Pindorama\pindorama-prospecting\dash-log.txt"
