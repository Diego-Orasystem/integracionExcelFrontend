#!/bin/bash

# Script para verificar la conectividad con el backend externo
# Fecha: $(date)

echo "🔍 Verificando conectividad con el backend..."
echo "================================================"

BACKEND_URL="http://10.90.0.213:5000"
API_URL="$BACKEND_URL/api"

echo "🌐 URL del Backend: $BACKEND_URL"
echo "🔗 URL de la API: $API_URL"
echo ""

# Función para verificar conectividad
check_connectivity() {
    echo "📡 Verificando conectividad básica..."
    
    # Ping al servidor
    if ping -c 1 10.90.0.213 >/dev/null 2>&1; then
        echo "✅ Ping exitoso a 10.90.0.213"
    else
        echo "❌ No se puede hacer ping a 10.90.0.213"
        return 1
    fi
    
    # Verificar puerto 5000
    if nc -z 10.90.0.213 5000 2>/dev/null; then
        echo "✅ Puerto 5000 está abierto"
    else
        echo "❌ Puerto 5000 no está accesible"
        return 1
    fi
    
    # Verificar respuesta HTTP
    echo "🔄 Verificando respuesta HTTP..."
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL" --connect-timeout 10)
    
    if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 404 ] || [ "$HTTP_STATUS" -eq 301 ] || [ "$HTTP_STATUS" -eq 302 ]; then
        echo "✅ Servidor HTTP responde (Status: $HTTP_STATUS)"
    else
        echo "❌ Servidor HTTP no responde correctamente (Status: $HTTP_STATUS)"
        return 1
    fi
    
    # Verificar API específica
    echo "🔄 Verificando endpoints de API..."
    
    # Intentar algunos endpoints comunes
    for endpoint in "health" "status" "api/health" "api/status" ""; do
        if [ -n "$endpoint" ]; then
            test_url="$BACKEND_URL/$endpoint"
        else
            test_url="$BACKEND_URL"
        fi
        
        echo "   Probando: $test_url"
        
        response=$(curl -s -w "%{http_code}" "$test_url" --connect-timeout 5)
        http_code="${response: -3}"
        
        if [ "$http_code" -eq 200 ]; then
            echo "   ✅ $endpoint responde correctamente"
            break
        elif [ "$http_code" -eq 404 ]; then
            echo "   ⚠️  $endpoint no encontrado (404)"
        else
            echo "   ❌ $endpoint error ($http_code)"
        fi
    done
    
    return 0
}

# Función para verificar configuración de archivos
check_config() {
    echo ""
    echo "📋 Verificando configuración de archivos..."
    
    # Verificar proxy.conf.json
    if [ -f "proxy.conf.json" ]; then
        echo "✅ proxy.conf.json existe"
        if grep -q "10.90.0.213:5000" proxy.conf.json; then
            echo "✅ proxy.conf.json configurado correctamente"
        else
            echo "❌ proxy.conf.json no tiene la URL correcta"
        fi
    else
        echo "❌ proxy.conf.json no encontrado"
    fi
    
    # Verificar nginx.conf
    if [ -f "nginx.conf" ]; then
        echo "✅ nginx.conf existe"
        if grep -q "10.90.0.213:5000" nginx.conf; then
            echo "✅ nginx.conf configurado correctamente"
        else
            echo "❌ nginx.conf no tiene la URL correcta"
        fi
    else
        echo "❌ nginx.conf no encontrado"
    fi
    
    # Verificar environments
    if [ -f "src/environments/environment.development.ts" ]; then
        echo "✅ environment.development.ts existe"
        if grep -q "10.90.0.213:5000" src/environments/environment.development.ts; then
            echo "✅ environment.development.ts configurado correctamente"
        else
            echo "❌ environment.development.ts no tiene la URL correcta"
        fi
    else
        echo "❌ environment.development.ts no encontrado"
    fi
}

# Función para mostrar resumen
show_summary() {
    echo ""
    echo "📊 RESUMEN DE CONFIGURACIÓN"
    echo "==========================="
    echo "Backend URL: $BACKEND_URL"
    echo "Fecha de verificación: $(date)"
    echo ""
    echo "Para rebuild del contenedor Docker:"
    echo "docker build --no-cache -t excel-manager-frontend:latest ."
    echo ""
    echo "Para ejecutar el contenedor:"
    echo "docker run -d --name excel-manager -p 80:80 excel-manager-frontend:latest"
}

# Ejecutar verificaciones
check_connectivity
check_config
show_summary

echo ""
echo "🏁 Verificación completada" 