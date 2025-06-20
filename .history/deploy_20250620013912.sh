#!/bin/bash

# Script de deployment para Excel Manager Frontend
# Autor: Sistema de Integración Excel
# Fecha: 2024

set -e

echo "🚀 Iniciando deployment de Excel Manager Frontend..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con color
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

print_step "1. Verificando archivos necesarios..."
required_files=("Dockerfile" "nginx.conf" "docker-compose.yml" "package.json")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Archivo requerido no encontrado: $file"
        exit 1
    fi
done
print_message "Todos los archivos necesarios están presentes ✓"

print_step "2. Construyendo imagen Docker..."
if docker build -t excel-manager-frontend:latest .; then
    print_message "Imagen construida exitosamente ✓"
else
    print_error "Error al construir la imagen Docker"
    exit 1
fi

print_step "3. Verificando imagen creada..."
if docker images excel-manager-frontend:latest | grep -q excel-manager-frontend; then
    print_message "Imagen verificada exitosamente ✓"
else
    print_error "No se pudo verificar la imagen"
    exit 1
fi

print_step "4. Deteniendo contenedores existentes..."
docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true

print_step "5. Iniciando servicios con Docker Compose..."
if docker-compose up -d 2>/dev/null || docker compose up -d 2>/dev/null; then
    print_message "Servicios iniciados exitosamente ✓"
else
    print_error "Error al iniciar los servicios"
    exit 1
fi

print_step "6. Verificando estado de los contenedores..."
sleep 5
if docker-compose ps 2>/dev/null || docker compose ps 2>/dev/null; then
    print_message "Contenedores verificados ✓"
fi

print_step "7. Verificando conectividad..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
    print_message "Aplicación accesible en http://localhost ✓"
else
    print_warning "La aplicación puede no estar completamente lista. Verifica en unos minutos."
fi

echo ""
echo "🎉 ¡Deployment completado exitosamente!"
echo ""
echo "📋 Información de acceso:"
echo "   URL: http://localhost"
echo "   Puerto: 80"
echo ""
echo "🔧 Comandos útiles:"
echo "   Ver logs: docker-compose logs -f frontend"
echo "   Reiniciar: docker-compose restart"
echo "   Detener: docker-compose down"
echo "   Estado: docker-compose ps"
echo ""
echo "📖 Para más información, consulta deployment-debian.html" 