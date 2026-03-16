# Scripts de Despliegue - UH SocialDash

Esta carpeta contiene scripts automatizados para facilitar el despliegue de UH SocialDash en un VPS de Hostinger.

## 📋 Contenido

- `deploy-vps.sh` - Script principal de despliegue
- `setup-cron.sh` - Script de configuración de trabajos automáticos

## 🚀 Uso Rápido

### 1. Preparación en tu Máquina Local

```bash
# Hacer scripts ejecutables (si no lo están ya)
chmod +x scripts/*.sh

# Subir scripts al VPS
scp scripts/*.sh root@TU_IP_VPS:/root/
```

### 2. Ejecutar Script Principal en el VPS

Conéctate a tu VPS vía SSH:

```bash
ssh root@TU_IP_VPS
```

Ejecuta el script principal:

```bash
cd /root
chmod +x deploy-vps.sh
./deploy-vps.sh
```

El script te solicitará:
- Dominio (ej: mi-dominio.com)
- Contraseña de base de datos (o genera una automática)
- Clave de encriptación (o genera una automática)
- Instagram App ID
- Instagram App Secret
- Usuario de GitHub

### 3. Ejecutar Script de Cron Jobs

Opcionalmente, configura los trabajos automáticos:

```bash
cd /root
chmod +x setup-cron.sh
./setup-cron.sh
```

## 📦 Qué Instala el Script Principal

- **Node.js 20.x** - Runtime de JavaScript
- **PostgreSQL 16** - Base de datos
- **Nginx** - Servidor web y reverse proxy
- **PM2** - Process manager (alternativo a systemd)
- **UFW** - Firewall
- **Fail2Ban** - Protección contra ataques de fuerza bruta

## ⚙️ Qué Configura el Script Principal

1. **Usuario de sistema** (`uh-social`)
2. **Base de datos PostgreSQL** con usuario y contraseña
3. **Aplicación** desde GitHub
4. **Variables de entorno** (.env)
5. **Build de producción** de Next.js
6. **Servicio systemd** para inicio automático
7. **Reverse proxy Nginx** en puerto 80
8. **Firewall** con puertos 22, 80, 443

## 📝 Notas Importantes

### Antes de Ejecutar

1. **Instagram App**: Debes tener creada tu app en [Meta Developers](https://developers.facebook.com/)
2. **Dominio**: Debes tener tu dominio apuntando a la IP del VPS
3. **GitHub**: Tu repositorio debe ser público o tener credenciales SSH configuradas

### Después de Ejecutar

1. **Configurar SSL** con Certbot:
   ```bash
   certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
   ```

2. **Verificar que la aplicación funcione**:
   - Abre `https://tu-dominio.com` en tu navegador
   - Verifica que puedas conectar tu cuenta de Instagram

3. **Configurar Instagram App** con la redirect URI correcta:
   - `https://tu-dominio.com/api/auth/callback`

## 🔧 Comandos Útiles

### Gestión de Servicios

```bash
# Ver estado de la aplicación
systemctl status uh-socialdash

# Reiniciar aplicación
systemctl restart uh-socialdash

# Ver logs
journalctl -u uh-socialdash -f
```

### Gestión de Base de Datos

```bash
# Conectar a PostgreSQL
sudo -u uh_socialdash psql -d uh_socialdash

# Hacer backup manual
pg_dump -U uh_socialdash uh_socialdash > backup.sql

# Restaurar backup
psql -U uh_socialdash uh_socialdash < backup.sql
```

### Actualización de la Aplicación

```bash
# Como usuario uh-social
su - uh-social
cd /var/www/uh-socialdash

# Actualizar código
git pull origin main

# Actualizar dependencias
npm ci

# Rebuild
npm run build

# Reiniciar servicio (como root)
exit
systemctl restart uh-socialdash
```

## 🔐 Seguridad

### Credenciales Generadas

El script genera automáticamente:
- **Contraseña de base de datos**: 32 caracteres aleatorios (Base64)
- **Clave de encriptación**: 32 bytes aleatorios (Base64)

**⚠️ IMPORTANTE**: Guarda estas credenciales en un lugar seguro. El script las mostrará al finalizar.

### Firewall

Puertos configurados:
- **22** - SSH
- **80** - HTTP
- **443** - HTTPS

### Fail2Ban

Protección contra ataques de fuerza bruta en SSH:
- **Máximo de intentos**: 3
- **Tiempo de bloqueo**: 1 hora (3600 segundos)

## 📊 Monitoreo

### Ver Uso de Recursos

```bash
# CPU y RAM
htop

# Espacio en disco
df -h

# Procesos corriendo
ps aux | grep node
```

### Ver Logs

```bash
# Aplicación
journalctl -u uh-socialdash -f

# Sincronización
journalctl -u uh-socialdash-sync -f

# Nginx (acceso)
tail -f /var/log/nginx/access.log

# Nginx (errores)
tail -f /var/log/nginx/error.log

# PostgreSQL
tail -f /var/log/postgresql/postgresql-16-main.log
```

## 🐛 Troubleshooting

### La aplicación no inicia

```bash
# Ver logs detallados
journalctl -u uh-socialdash -n 100

# Verificar que el puerto 3000 esté libre
netstat -tlnp | grep 3000

# Verificar que .env exista y tenga permisos
ls -la /var/www/uh-socialdash/.env
```

### Error de conexión a base de datos

```bash
# Verificar que PostgreSQL esté corriendo
systemctl status postgresql

# Verificar conexión
sudo -u uh_socialdash psql -d uh_socialdash -c "SELECT 1;"
```

### Error 502 Bad Gateway

```bash
# Verificar que Next.js esté corriendo
systemctl status uh-socialdash

# Verificar que nginx esté funcionando
systemctl status nginx
nginx -t
```

### Los datos no se sincronizan

```bash
# Verificar servicio de sincronización
systemctl status uh-socialdash-sync

# Ver logs de sincronización
tail -f /var/log/uh-socialdash/sync-output.log

# Ejecutar sincronización manual
sudo -u uh-social /var/www/uh-socialdash/scripts/manual-sync.js
```

## 📚 Documentación Adicional

Para más información, consulta:
- [Guía completa de despliegue](../docs/hostinger-vps-deployment-guide.md)
- [README principal](../README.md)
- [Documentación de Next.js](https://nextjs.org/docs/deployment)

## ⚡ Proceso de Despliegue Completo

```bash
# 1. Subir scripts al VPS
scp scripts/*.sh root@TU_IP_VPS:/root/

# 2. Conectar al VPS
ssh root@TU_IP_VPS

# 3. Ejecutar despliegue principal
cd /root
./deploy-vps.sh

# 4. Configurar SSL
certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# 5. Configurar trabajos automáticos
./setup-cron.sh

# 6. Verificar que todo funcione
systemctl status uh-socialdash
systemctl status uh-socialdash-sync
systemctl status nginx

# 7. Abrir el navegador
# https://tu-dominio.com
```

## 💡 Tips

1. **Guarda las credenciales**: El script genera contraseñas seguras automáticamente. Guárdalas en un gestor de contraseñas.

2. **Usa SSH Keys**: En lugar de contraseñas, configura claves SSH para acceso más seguro.

3. **Backups regulares**: El script de cron configura backups diarios de la base de datos. Verifica que funcionen correctamente.

4. **Monitoreo**: Considera instalar herramientas de monitoreo como Netdata o configurar alertas.

5. **Actualizaciones**: Mantén el sistema actualizado con `apt update && apt upgrade -y` regularmente.

## 🆘 Soporte

Si encuentras problemas:
1. Revisa los logs de cada servicio
2. Consulta la sección de Troubleshooting
3. Revisa la [guía completa](../docs/hostinger-vps-deployment-guide.md)
4. Abre un issue en GitHub

---

**Versión**: 1.0.0
**Última actualización**: 2025-01-16
