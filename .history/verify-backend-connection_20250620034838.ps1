# Script para verificar la conectividad con el backend externo
# Fecha: Get-Date

Write-Host "🔍 Verificando conectividad con el backend..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$BackendUrl = "http://10.90.0.213:5000"
$ApiUrl = "$BackendUrl/api"

Write-Host "🌐 URL del Backend: $BackendUrl" -ForegroundColor White
Write-Host "🔗 URL de la API: $ApiUrl" -ForegroundColor White
Write-Host ""

# Función para verificar conectividad
function Test-Connectivity {
    Write-Host "📡 Verificando conectividad básica..." -ForegroundColor Yellow
    
    # Ping al servidor
    try {
        $ping = Test-Connection -ComputerName "10.90.0.213" -Count 1 -Quiet
        if ($ping) {
            Write-Host "✅ Ping exitoso a 10.90.0.213" -ForegroundColor Green
        } else {
            Write-Host "❌ No se puede hacer ping a 10.90.0.213" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Error al hacer ping: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    
    # Verificar puerto 5000
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $connection = $tcpClient.BeginConnect("10.90.0.213", 5000, $null, $null)
        $wait = $connection.AsyncWaitHandle.WaitOne(3000, $false)
        
        if ($wait) {
            Write-Host "✅ Puerto 5000 está abierto" -ForegroundColor Green
            $tcpClient.Close()
        } else {
            Write-Host "❌ Puerto 5000 no está accesible" -ForegroundColor Red
            $tcpClient.Close()
            return $false
        }
    } catch {
        Write-Host "❌ Error verificando puerto: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    
    # Verificar respuesta HTTP
    Write-Host "🔄 Verificando respuesta HTTP..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $BackendUrl -TimeoutSec 10 -UseBasicParsing
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq 200 -or $statusCode -eq 404 -or $statusCode -eq 301 -or $statusCode -eq 302) {
            Write-Host "✅ Servidor HTTP responde (Status: $statusCode)" -ForegroundColor Green
        } else {
            Write-Host "❌ Servidor HTTP no responde correctamente (Status: $statusCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Error HTTP: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    
    # Verificar API específica
    Write-Host "🔄 Verificando endpoints de API..." -ForegroundColor Yellow
    
    $endpoints = @("health", "status", "api/health", "api/status", "")
    
    foreach ($endpoint in $endpoints) {
        if ($endpoint -ne "") {
            $testUrl = "$BackendUrl/$endpoint"
        } else {
            $testUrl = $BackendUrl
        }
        
        Write-Host "   Probando: $testUrl" -ForegroundColor Gray
        
        try {
            $response = Invoke-WebRequest -Uri $testUrl -TimeoutSec 5 -UseBasicParsing
            $httpCode = $response.StatusCode
            
            if ($httpCode -eq 200) {
                Write-Host "   ✅ $endpoint responde correctamente" -ForegroundColor Green
                break
            } elseif ($httpCode -eq 404) {
                Write-Host "   ⚠️  $endpoint no encontrado (404)" -ForegroundColor Yellow
            } else {
                Write-Host "   ❌ $endpoint error ($httpCode)" -ForegroundColor Red
            }
        } catch {
            Write-Host "   ❌ $endpoint error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    return $true
}

# Función para verificar configuración de archivos
function Test-Configuration {
    Write-Host ""
    Write-Host "📋 Verificando configuración de archivos..." -ForegroundColor Yellow
    
    # Verificar proxy.conf.json
    if (Test-Path "proxy.conf.json") {
        Write-Host "✅ proxy.conf.json existe" -ForegroundColor Green
        $content = Get-Content "proxy.conf.json" -Raw
        if ($content -match "10.90.0.213:5000") {
            Write-Host "✅ proxy.conf.json configurado correctamente" -ForegroundColor Green
        } else {
            Write-Host "❌ proxy.conf.json no tiene la URL correcta" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ proxy.conf.json no encontrado" -ForegroundColor Red
    }
    
    # Verificar nginx.conf
    if (Test-Path "nginx.conf") {
        Write-Host "✅ nginx.conf existe" -ForegroundColor Green
        $content = Get-Content "nginx.conf" -Raw
        if ($content -match "10.90.0.213:5000") {
            Write-Host "✅ nginx.conf configurado correctamente" -ForegroundColor Green
        } else {
            Write-Host "❌ nginx.conf no tiene la URL correcta" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ nginx.conf no encontrado" -ForegroundColor Red
    }
    
    # Verificar environments
    if (Test-Path "src/environments/environment.development.ts") {
        Write-Host "✅ environment.development.ts existe" -ForegroundColor Green
        $content = Get-Content "src/environments/environment.development.ts" -Raw
        if ($content -match "10.90.0.213:5000") {
            Write-Host "✅ environment.development.ts configurado correctamente" -ForegroundColor Green
        } else {
            Write-Host "❌ environment.development.ts no tiene la URL correcta" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ environment.development.ts no encontrado" -ForegroundColor Red
    }
}

# Función para mostrar resumen
function Show-Summary {
    Write-Host ""
    Write-Host "📊 RESUMEN DE CONFIGURACIÓN" -ForegroundColor Cyan
    Write-Host "===========================" -ForegroundColor Cyan
    Write-Host "Backend URL: $BackendUrl" -ForegroundColor White
    Write-Host "Fecha de verificación: $(Get-Date)" -ForegroundColor White
    Write-Host ""
    Write-Host "Para rebuild del contenedor Docker:" -ForegroundColor Yellow
    Write-Host "docker build --no-cache -t excel-manager-frontend:latest ." -ForegroundColor Gray
    Write-Host ""
    Write-Host "Para ejecutar el contenedor:" -ForegroundColor Yellow
    Write-Host "docker run -d --name excel-manager -p 80:80 excel-manager-frontend:latest" -ForegroundColor Gray
}

# Ejecutar verificaciones
Test-Connectivity
Test-Configuration
Show-Summary

Write-Host ""
Write-Host "🏁 Verificación completada" -ForegroundColor Green 