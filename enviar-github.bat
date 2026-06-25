@echo off
echo Inicializando Git e enviando para GitHub...
git init
git add .
git commit -m "Entrega da prova pratica"
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/thiagohvs12/PROVA-PROGRAMA-O-AVAN-ADA---26-06.git
git push -u origin main
pause
