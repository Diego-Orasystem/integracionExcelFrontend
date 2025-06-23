#!/bin/bash

echo "🔍 VERIFICACIÓN DE ENVIRONMENTS"
echo "================================"

echo ""
echo "📁 Contenido de environment.ts (USADO EN PRODUCCIÓN):"
echo "---------------------------------------------------"
cat src/environments/environment.ts
echo ""

echo "📁 Contenido de environment.development.ts:"
echo "--------------------------------------------"
cat src/environments/environment.development.ts
echo ""

echo "📁 Contenido de environment.prod.ts:"
echo "------------------------------------"
cat src/environments/environment.prod.ts
echo ""

echo "⚙️  Configuración de Angular Build:"
echo "-----------------------------------"
grep -A 20 '"production"' angular.json | grep -E '(fileReplacements|replace|with)'
echo ""

echo "📋 RESUMEN:"
echo "==========="
echo "🔧 Desarrollo (npm start): Usa environment.development.ts"
echo "🏭 Producción (Docker): Usa environment.ts (NO environment.prod.ts)"
echo ""
echo "💡 IMPORTANTE: Angular.json NO tiene fileReplacements para producción"
echo "   Por eso usa environment.ts en lugar de environment.prod.ts" 