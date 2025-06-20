# 🔧 Opciones de Deployment - Excel Manager Frontend

## Problema actual:
El build de Docker falla en la máquina remota con errores de módulos no encontrados, específicamente con el módulo de logs.

## 🎯 Opción 1: Usar módulo tradicional (RECOMENDADO)
**Estado:** ✅ Implementado en el commit actual

```bash
# En la máquina remota:
git pull origin main
docker build --no-cache -t excel-manager-frontend:latest .
```

**Cambios realizados:**
- Cambiar `loadComponent` a `loadChildren` para logs
- Arreglar `logs.module.ts` para importar el componente standalone
- Usar routing tradicional más estable

---

## 🎯 Opción 2: Remover módulo de logs temporalmente
Si la Opción 1 no funciona, remover logs del routing:

```typescript
// En src/app/app-routing.module.ts - COMENTAR esta sección:
/*
{
  path: 'logs',
  loadChildren: () => import('./modules/logs').then(m => m.LogsModule),
  canActivate: [AuthGuard],
  data: { roles: ['admin', 'company_admin'] }
},
*/
```

---

## 🎯 Opción 3: Deployment sin Docker
Usar build tradicional de Angular:

```bash
# En la máquina remota:
npm ci --legacy-peer-deps
npm run build
# Servir con nginx tradicional o Apache
```

---

## 🎯 Opción 4: Usar imagen base diferente
Cambiar Dockerfile para usar imagen más estable:

```dockerfile
# Usar Node 16 en lugar de 18
FROM node:16-alpine AS build
```

---

## 🎯 Opción 5: Build local + transferencia
Hacer build localmente y transferir archivos:

```bash
# Local (Windows):
npm run build
# Comprimir dist/excel-manager
tar -czf dist.tar.gz dist/excel-manager

# Transferir a servidor:
scp dist.tar.gz usuario@servidor:/path/to/app/

# En servidor:
tar -xzf dist.tar.gz
# Configurar nginx para servir desde dist/excel-manager
```

---

## 🎯 Opción 6: Usar Docker Hub
Subir imagen a Docker Hub desde local:

```bash
# Local:
docker build -t tu-usuario/excel-manager-frontend:latest .
docker push tu-usuario/excel-manager-frontend:latest

# En servidor:
docker pull tu-usuario/excel-manager-frontend:latest
docker run -d -p 80:80 tu-usuario/excel-manager-frontend:latest
```

---

## 🎯 Opción 7: Diagnóstico completo
Script para diagnosticar problemas:

```bash
#!/bin/bash
echo "=== DIAGNÓSTICO COMPLETO ==="
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Docker version: $(docker --version)"
echo ""
echo "=== ESTRUCTURA DEL PROYECTO ==="
find src/app/modules -name "*.ts" | head -20
echo ""
echo "=== LOGS MODULE ==="
ls -la src/app/modules/logs/ || echo "❌ Directorio logs no existe"
echo ""
echo "=== PACKAGE.JSON ==="
cat package.json | grep -A5 -B5 "angular"
echo ""
echo "=== MEMORIA Y ESPACIO ==="
free -h
df -h
```

---

## 📋 Orden de prioridad recomendado:

1. **Opción 1** - Usar módulo tradicional (ya implementado)
2. **Opción 2** - Remover logs temporalmente si falla
3. **Opción 5** - Build local + transferencia (más rápido)
4. **Opción 3** - Deployment sin Docker
5. **Opción 6** - Docker Hub (si tienes cuenta)
6. **Opción 4** - Cambiar imagen base
7. **Opción 7** - Diagnóstico completo

---

## 🚨 Comandos de emergencia:

```bash
# Limpiar todo y empezar de cero:
docker system prune -a -f
rm -rf node_modules
rm package-lock.json
npm cache clean --force
npm install --legacy-peer-deps

# Verificar integridad del proyecto:
find . -name "*.ts" -exec grep -l "import.*logs" {} \;

# Build mínimo sin logs:
# Comentar ruta de logs en app-routing.module.ts
npm run build
```

---

**💡 Recomendación:** Empieza con la Opción 1, si falla en 5 minutos, pasa directamente a la Opción 5 (build local + transferencia) que es la más rápida y confiable. 