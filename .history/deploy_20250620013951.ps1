# Script de deployment para Excel Manager Frontend - Windows PowerShell
# Autor: Sistema de Integración Excel
# Fecha: 2024

param(
    [switch]$Help
)

if ($Help) {
    Write-Host "🚀 Script de Deployment - Excel Manager Frontend" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Uso: .\deploy.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Este script automatiza el deployment de la aplicación usando Docker." -ForegroundColor Gray
    exit 0
}

# Función para imprimir mensajes con color
function Write-Step {
    param($Message)
    Write-Host "[STEP] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[INFO] $Message ✓" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

try {
    Write-Host "🚀 Iniciando deployment de Excel Manager Frontend..." -ForegroundColor Cyan
    Write-Host ""

    # Verificar si Docker está instalado
    Write-Step "Verificando Docker..."
    if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker no está instalado o no está en el PATH."
        Write-Host "Por favor instala Docker Desktop desde: https://www.docker.com/products/docker-desktop" -ForegroundColor Gray
        exit 1
    }
    Write-Success "Docker encontrado"

    # Verificar si Docker está ejecutándose
    try {
        docker version | Out-Null
        Write-Success "Docker está ejecutándose"
    }
    catch {
        Write-Error "Docker no está ejecutándose. Por favor inicia Docker Desktop."
        exit 1
    }

    # Verificar archivos necesarios
    Write-Step "Verificando archivos necesarios..."
    $requiredFiles = @("Dockerfile", "nginx.conf", "docker-compose.yml", "package.json")
    foreach ($file in $requiredFiles) {
        if (!(Test-Path $file)) {
            Write-Error "Archivo requerido no encontrado: $file"
            exit 1
        }
    }
    Write-Success "Todos los archivos necesarios están presentes"

    # Construir imagen Docker
    Write-Step "Construyendo imagen Docker..."
    $buildResult = docker build -t excel-manager-frontend:latest . 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error al construir la imagen Docker"
        Write-Host $buildResult -ForegroundColor Red
        exit 1
    }
    Write-Success "Imagen construida exitosamente"

    # Verificar imagen creada
    Write-Step "Verificando imagen creada..."
    $imageCheck = docker images excel-manager-frontend:latest --format "{{.Repository}}"
    if ($imageCheck -contains "excel-manager-frontend") {
        Write-Success "Imagen verificada exitosamente"
    }
    else {
        Write-Error "No se pudo verificar la imagen"
        exit 1
    }

    # Detener contenedores existentes
    Write-Step "Deteniendo contenedores existentes..."
    try {
        docker compose down 2>$null
    }
    catch {
        # Ignorar errores si no hay contenedores ejecutándose
    }

    # Iniciar servicios con Docker Compose
    Write-Step "Iniciando servicios con Docker Compose..."
    $composeResult = docker compose up -d 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error al iniciar los servicios"
        Write-Host $composeResult -ForegroundColor Red
        exit 1
    }
    Write-Success "Servicios iniciados exitosamente"

    # Esperar un momento para que los servicios se inicien
    Write-Step "Esperando que los servicios se inicien..."
    Start-Sleep -Seconds 5

    # Verificar estado de los contenedores
    Write-Step "Verificando estado de los contenedores..."
    docker compose ps

    # Verificar conectividad
    Write-Step "Verificando conectividad..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost" -Method Head -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Success "Aplicación accesible en http://localhost"
        }
    }
    catch {
        Write-Warning "La aplicación puede no estar completamente lista. Verifica en unos minutos."
    }

    Write-Host ""
    Write-Host "🎉 ¡Deployment completado exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Información de acceso:" -ForegroundColor Cyan
    Write-Host "   URL: http://localhost" -ForegroundColor White
    Write-Host "   Puerto: 80" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Comandos útiles:" -ForegroundColor Cyan
    Write-Host "   Ver logs: docker compose logs -f frontend" -ForegroundColor Gray
    Write-Host "   Reiniciar: docker compose restart" -ForegroundColor Gray
    Write-Host "   Detener: docker compose down" -ForegroundColor Gray
    Write-Host "   Estado: docker compose ps" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📖 Para más información, consulta deployment-debian.html" -ForegroundColor Cyan

}
catch {
    Write-Error "Error inesperado durante el deployment: $($_.Exception.Message)"
    exit 1
} 