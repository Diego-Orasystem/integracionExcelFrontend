#!/bin/bash

# Script de verificación de correcciones para Excel Manager Frontend
# Ejecutar después de hacer git pull para verificar que las correcciones se aplicaron

echo "🔍 Verificando correcciones aplicadas..."
echo ""

# Verificar corrección en nginx.conf
echo "1. Verificando nginx.conf..."
if grep -q "gzip_proxied expired no-cache no-store private auth;" nginx.conf; then
    echo "✅ nginx.conf: Corrección aplicada correctamente"
else
    echo "❌ nginx.conf: ERROR - La corrección NO se aplicó"
    echo "   Línea esperada: gzip_proxied expired no-cache no-store private auth;"
    echo "   Línea actual:"
    grep "gzip_proxied" nginx.conf || echo "   (línea no encontrada)"
fi

echo ""

# Verificar corrección en app-routing.module.ts
echo "2. Verificando app-routing.module.ts..."
if grep -q "loadComponent: () => import('./modules/logs/logs.component')" src/app/app-routing.module.ts; then
    echo "✅ app-routing.module.ts: Corrección aplicada correctamente"
else
    echo "❌ app-routing.module.ts: ERROR - La corrección NO se aplicó"
    echo "   Línea esperada: loadComponent: () => import('./modules/logs/logs.component')"
    echo "   Línea actual:"
    grep -A1 -B1 "path: 'logs'" src/app/app-routing.module.ts || echo "   (línea no encontrada)"
fi

echo ""

# Verificar que los archivos Docker existen
echo "3. Verificando archivos Docker..."
required_files=("Dockerfile" "nginx.conf" "docker-compose.yml" ".dockerignore")
all_files_exist=true

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file: Existe"
    else
        echo "❌ $file: NO EXISTE"
        all_files_exist=false
    fi
done

echo ""

# Verificar estructura del proyecto
echo "4. Verificando estructura del proyecto..."
if [ -f "src/app/modules/logs/logs.component.ts" ]; then
    echo "✅ LogsComponent: Existe"
else
    echo "❌ LogsComponent: NO EXISTE"
fi

if [ -f "package.json" ]; then
    echo "✅ package.json: Existe"
else
    echo "❌ package.json: NO EXISTE"
fi

echo ""

# Resumen
echo "📋 RESUMEN:"
if grep -q "gzip_proxied expired no-cache no-store private auth;" nginx.conf && \
   grep -q "loadComponent: () => import('./modules/logs/logs.component')" src/app/app-routing.module.ts && \
   $all_files_exist; then
    echo "🎉 ¡Todas las correcciones están aplicadas correctamente!"
    echo ""
    echo "✅ Puedes proceder con el build de Docker:"
    echo "   docker build -t excel-manager-frontend:latest ."
    echo ""
    echo "✅ O usar el script de deployment:"
    echo "   ./deploy.sh"
else
    echo "⚠️  Algunas correcciones no se aplicaron correctamente."
    echo ""
    echo "🔧 Comandos para aplicar las correcciones manualmente:"
    echo ""
    echo "1. Para nginx.conf:"
    echo "   sed -i 's/gzip_proxied expired no-cache no-store private must-revalidate auth;/gzip_proxied expired no-cache no-store private auth;/' nginx.conf"
    echo ""
    echo "2. Para app-routing.module.ts:"
    echo "   sed -i \"s/loadChildren: () => import('.\/modules\/logs\/logs.module')/loadComponent: () => import('.\/modules\/logs\/logs.component')/\" src/app/app-routing.module.ts"
    echo ""
fi

echo ""
echo "📖 Para más información, consulta deployment-debian.html" 