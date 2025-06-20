#!/bin/bash

# Script de actualización rápida - Configuración Backend Externa
# Ejecutar en la máquina virtual después de hacer git pull

echo "🚀 Actualizando configuración para backend externo..."
echo "========================================================="

# 1. Detener contenedores existentes
echo "⏹️  Deteniendo contenedores existentes..."
docker stop excel-manager-frontend excel-manager 2>/dev/null || true
docker rm excel-manager-frontend excel-manager 2>/dev/null || true

# 2. Limpiar contenedores parados
echo "🧹 Limpiando contenedores parados..."
docker container prune -f

# 3. Rebuild de la imagen
echo "🔨 Construyendo nueva imagen..."
docker build --no-cache -t excel-manager-frontend:latest .

# 4. Ejecutar nuevo contenedor
echo "🚀 Ejecutando nuevo contenedor..."
docker-compose up -d

# 5. Verificar estado
echo "✅ Verificando estado..."
sleep 3
docker ps

echo ""
echo "🎯 CONFIGURACIÓN ACTUALIZADA"
echo "=========================="
echo "✅ Environment de producción: http://10.90.0.213:5000/api"
echo "✅ Nginx simplificado sin proxy"
echo "✅ Headers CORS configurados"
echo "✅ CSP actualizado para permitir conexión al backend"
echo ""
echo "🌐 URL del frontend: http://10.90.0.11"
echo "🔗 URL del backend: http://10.90.0.213:5000"
echo ""
echo "Para verificar logs:"
echo "docker logs excel-manager-frontend" 