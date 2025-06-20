@echo off
ECHO Instalando dependencias para las visualizaciones...

REM Instalar D3.js y sus tipos
call npm install d3 @types/d3 --save

REM Instalar Font Awesome para los iconos
call npm install @fortawesome/fontawesome-free --save

ECHO.
ECHO Instalación completada. Para iniciar el servidor de desarrollo, ejecuta 'npm start'.
ECHO.

PAUSE 