#!/bin/bash

# Script para instalar las dependencias necesarias para las visualizaciones del panel de control

echo "Instalando dependencias para las visualizaciones..."

# Instalar D3.js y sus tipos
npm install d3 @types/d3 --save

# Instalar Font Awesome para los iconos
npm install @fortawesome/fontawesome-free --save

# Verificar que todas las dependencias estén instaladas
echo "Verificando el estado de las dependencias..."

DEPENDENCIES=("d3" "@types/d3" "@fortawesome/fontawesome-free")
MISSING=0

for dep in "${DEPENDENCIES[@]}"; do
  if ! grep -q "\"$dep\"" package.json; then
    echo "⚠️ Falta la dependencia: $dep"
    MISSING=1
  else
    echo "✅ Dependencia instalada: $dep"
  fi
done

if [ $MISSING -eq 1 ]; then
  echo "⚠️ Algunas dependencias no están instaladas. Por favor, ejecuta 'npm install' de nuevo."
else
  echo "✅ Todas las dependencias están instaladas correctamente."
fi

echo "Instalación completada. Para iniciar el servidor de desarrollo, ejecuta 'npm start'." 