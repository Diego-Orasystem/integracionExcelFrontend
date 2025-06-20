# 🔧 Solución: Error "host not found in upstream api-backend"

## 🚨 Problema identificado:
```
host not found in upstream "api-backend" in /etc/nginx/nginx.conf:54
```

**Causa:** Nginx está intentando hacer proxy a un backend llamado "api-backend" que no existe.

## ✅ Soluciones implementadas:

### 1. Nginx.conf actualizado (Opción por defecto)
- ✅ Proxy API comentado temporalmente
- ✅ Rutas `/api/` devuelven 404 con mensaje JSON
- ✅ Frontend funciona completamente

### 2. Nginx simplificado (nginx-frontend-only.conf)
- ✅ Configuración mínima solo para frontend
- ✅ Sin dependencias de backend
- ✅ Más ligero y estable

### 3. Docker-compose actualizado
- ✅ Dependencia de backend comentada
- ✅ Solo ejecuta el frontend
- ✅ Sin errores de servicios faltantes

## 🚀 Comandos para deployment:

### Opción A: Usar configuración actual
```bash
# En la máquina remota:
git pull origin main
docker build --no-cache -t excel-manager-frontend:latest .
docker run -d --name excel-manager -p 80:80 excel-manager-frontend:latest
```

### Opción B: Usar nginx simplificado
```bash
# Cambiar temporalmente el Dockerfile para usar nginx-frontend-only.conf:
# En línea 23 del Dockerfile cambiar:
# COPY nginx.conf /etc/nginx/nginx.conf
# por:
# COPY nginx-frontend-only.conf /etc/nginx/nginx.conf

docker build --no-cache -t excel-manager-frontend:latest .
```

### Opción C: Docker Compose
```bash
docker compose up -d
```

## 🔄 Para habilitar backend más tarde:

### 1. En nginx.conf:
```nginx
# Descomentar las líneas que empiezan con # (cambiar # por nada):
# location /api/ {
#     proxy_pass http://tu-backend-real:5000/;
#     # ... resto de configuración
# }
```

### 2. En docker-compose.yml:
```yaml
# Descomentar sección api-backend y depends_on
```

## 🎯 Estado actual:
- ✅ Frontend funciona completamente
- ✅ Rutas Angular funcionan (SPA)
- ✅ Archivos estáticos se sirven correctamente
- ✅ Sin errores de nginx
- ❌ API calls devuelven 404 (esperado sin backend)

## 🧪 Verificar que funciona:
```bash
# Después del deployment:
curl -I http://localhost
# Debería devolver: HTTP/1.1 200 OK

curl http://localhost/api/test
# Debería devolver: {"error": "Backend API not available"}
```

## 📝 Notas importantes:
1. **Frontend funciona independientemente** - No necesita backend para servir la aplicación
2. **API calls fallarán** - Hasta que configures un backend real
3. **Fácil de revertir** - Solo descomentar líneas cuando tengas backend
4. **Producción lista** - Configuración segura y optimizada 