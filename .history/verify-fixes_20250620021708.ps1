# Script de verificación de correcciones para Excel Manager Frontend - PowerShell
# Ejecutar después de hacer git pull para verificar que las correcciones se aplicaron

Write-Host "🔍 Verificando correcciones aplicadas..." -ForegroundColor Cyan
Write-Host ""

$allCorrect = $true

# Verificar corrección en nginx.conf
Write-Host "1. Verificando nginx.conf..." -ForegroundColor Blue
if (Test-Path "nginx.conf") {
    $nginxContent = Get-Content "nginx.conf" -Raw
    if ($nginxContent -match "gzip_proxied expired no-cache no-store private auth;") {
        Write-Host "✅ nginx.conf: Corrección aplicada correctamente" -ForegroundColor Green
    } else {
        Write-Host "❌ nginx.conf: ERROR - La corrección NO se aplicó" -ForegroundColor Red
        Write-Host "   Línea esperada: gzip_proxied expired no-cache no-store private auth;" -ForegroundColor Gray
        Write-Host "   Línea actual:" -ForegroundColor Gray
        $gzipLine = Select-String -Path "nginx.conf" -Pattern "gzip_proxied"
        if ($gzipLine) {
            Write-Host "   $($gzipLine.Line.Trim())" -ForegroundColor Gray
        } else {
            Write-Host "   (línea no encontrada)" -ForegroundColor Gray
        }
        $allCorrect = $false
    }
} else {
    Write-Host "❌ nginx.conf: Archivo NO EXISTE" -ForegroundColor Red
    $allCorrect = $false
}

Write-Host ""

# Verificar corrección en app-routing.module.ts
Write-Host "2. Verificando app-routing.module.ts..." -ForegroundColor Blue
if (Test-Path "src/app/app-routing.module.ts") {
    $routingContent = Get-Content "src/app/app-routing.module.ts" -Raw
    if ($routingContent -match "loadComponent: \(\) => import\('\./modules/logs/logs\.component'\)") {
        Write-Host "✅ app-routing.module.ts: Corrección aplicada correctamente" -ForegroundColor Green
    } else {
        Write-Host "❌ app-routing.module.ts: ERROR - La corrección NO se aplicó" -ForegroundColor Red
        Write-Host "   Línea esperada: loadComponent: () => import('./modules/logs/logs.component')" -ForegroundColor Gray
        Write-Host "   Línea actual:" -ForegroundColor Gray
        $logsLine = Select-String -Path "src/app/app-routing.module.ts" -Pattern "path: 'logs'" -Context 1,1
        if ($logsLine) {
            $logsLine.Context.PreContext | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
            Write-Host "   $($logsLine.Line.Trim())" -ForegroundColor Gray
            $logsLine.Context.PostContext | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
        } else {
            Write-Host "   (línea no encontrada)" -ForegroundColor Gray
        }
        $allCorrect = $false
    }
} else {
    Write-Host "❌ app-routing.module.ts: Archivo NO EXISTE" -ForegroundColor Red
    $allCorrect = $false
}

Write-Host ""

# Verificar que los archivos Docker existen
Write-Host "3. Verificando archivos Docker..." -ForegroundColor Blue
$requiredFiles = @("Dockerfile", "nginx.conf", "docker-compose.yml", ".dockerignore")
$allFilesExist = $true

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file`: Existe" -ForegroundColor Green
    } else {
        Write-Host "❌ $file`: NO EXISTE" -ForegroundColor Red
        $allFilesExist = $false
        $allCorrect = $false
    }
}

Write-Host ""

# Verificar estructura del proyecto
Write-Host "4. Verificando estructura del proyecto..." -ForegroundColor Blue
if (Test-Path "src/app/modules/logs/logs.component.ts") {
    Write-Host "✅ LogsComponent: Existe" -ForegroundColor Green
} else {
    Write-Host "❌ LogsComponent: NO EXISTE" -ForegroundColor Red
    $allCorrect = $false
}

if (Test-Path "package.json") {
    Write-Host "✅ package.json: Existe" -ForegroundColor Green
} else {
    Write-Host "❌ package.json: NO EXISTE" -ForegroundColor Red
    $allCorrect = $false
}

Write-Host ""

# Resumen
Write-Host "📋 RESUMEN:" -ForegroundColor Cyan
if ($allCorrect) {
    Write-Host "🎉 ¡Todas las correcciones están aplicadas correctamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Puedes proceder con el build de Docker:" -ForegroundColor Green
    Write-Host "   docker build -t excel-manager-frontend:latest ." -ForegroundColor White
    Write-Host ""
    Write-Host "✅ O usar el script de deployment:" -ForegroundColor Green
    Write-Host "   .\deploy.ps1" -ForegroundColor White
} else {
    Write-Host "⚠️  Algunas correcciones no se aplicaron correctamente." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔧 Comandos para aplicar las correcciones manualmente:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Para nginx.conf:" -ForegroundColor Yellow
    Write-Host "   (Get-Content nginx.conf) -replace 'gzip_proxied expired no-cache no-store private must-revalidate auth;', 'gzip_proxied expired no-cache no-store private auth;' | Set-Content nginx.conf" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Para app-routing.module.ts:" -ForegroundColor Yellow
    Write-Host "   (Get-Content src/app/app-routing.module.ts) -replace \"loadChildren: \(\) => import\('\./modules/logs/logs\.module'\)\", \"loadComponent: () => import('./modules/logs/logs.component')\" | Set-Content src/app/app-routing.module.ts" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
Write-Host "📖 Para más información, consulta deployment-debian.html" -ForegroundColor Cyan 