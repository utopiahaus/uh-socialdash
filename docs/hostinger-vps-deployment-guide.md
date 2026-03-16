# Guía de Despliegue - Hostinger VPS

Guía completa para desplegar UH SocialDash en un VPS de Hostinger.

## 📋 Requisitos Previos

### VPS Requerimientos
- **CPU**: 2 vCPU mínimo
- **RAM**: 4GB GB mínimo (2GB para app + 2GB para PostgreSQL)
- **Almacenamiento**: 40GB SSD mínimo
- **Sistema Operativo**: Ubuntu 22.04 LTS o 24.04 LTS
- **Ancho de banda**: Ilimitado o mínimo 1TB/mes

### Herramientas Necesarias en tu Máquina Local
- Cliente SSH (terminal nativo o PuTTY en Windows)
- Cliente SCP (para subir archivos) o Git
- Instagram App configurada en [Meta Developers](https://developers.facebook.com/)

---

## 🚀 Paso 1: Conexión al VPS

### 1.1 Obtener Credenciales SSH
Desde el panel de Hostinger:
1. Ve a **Servers** → **VPS**
2. Selecciona tu VPS
3. Copia la **IP del servidor**
4. Ve a **SSH Access** → copia la **contraseña root**

### 1.2 Conectar vía SSH
```bash
ssh root@TU_IP_VPS
# Ingresa la contraseña root cuando se solicite
```

### 1.3 Actualizar Sistema
```bash
apt update && apt upgrade -y
```

---

## 📦 Paso 2: Instalación de Dependencias

### 2.1 Instalar Herramientas Esenciales
```bash
apt install -y curl wget git unzip build-essential software-properties-common
```

### 2.2 Instalar Node.js 20.x (LTS)
```bash
# Agregar repositorio NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Instalar Node.js
apt install -y nodejs

# Verificar instalación
node --version  # Debe ser v20.x.x
npm --version   # Debe ser 10.x.x
```

### 2.3 Instalar PostgreSQL 16
```bash
# Agregar repositorio PostgreSQL
apt install -y postgresql-16 postgresql-contrib-16

# Iniciar servicio PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Verificar instalación
psql --version  # Debe ser 16.x
```

### 2.4 Instalar Nginx
```bash
apt install -y nginx

# Iniciar Nginx
systemctl start nginx
systemctl enable nginx

# Verificar
nginx -v
```

### 2.5 Instalar PM2 (Process Manager)
```bash
npm install -g pm2

# Verificar
pm2 --version
```

---

## 🗄️ Paso 3: Configuración de PostgreSQL

### 3.1 Crear Usuario y Base de Datos
```bash
# Acceder a PostgreSQL
sudo -u postgres psql

# Ejecutar estos comandos en psql:
CREATE USER uh_socialdash WITH ENCRYPTED PASSWORD 'CONTRASEÑA_SEGURA_AQUI';
CREATE DATABASE uh_socialdash OWNER uh_socialdash;
GRANT ALL PRIVILEGES ON DATABASE uh_socialdash TO uh_socialdash;
\q
```

**⚠️ IMPORTANTE**: Reemplaza `CONTRASEÑA_SEGURA_AQUI` con una contraseña fuerte.

### 3.2 Configurar Acceso Remoto (Opcional)
Si necesitas acceso desde tu máquina local para desarrollo:
```bash
# Editar configuración
nano /etc/postgresql/16/main/postgresql.conf

# Cambiar esta línea:
# listen_addresses = 'localhost'
# Por:
listen_addresses = '*'

# Editar pg_hba.conf
nano /etc/postgresql/16/main/pg_hba.conf

# Agregar al final:
host    all    all    0.0.0.0/0    md5

# Reiniciar PostgreSQL
systemctl restart postgresql
```

---

## 🔧 Paso 4: Preparar Aplicación

### 4.1 Crear Usuario para la Aplicación
```bash
# Crear usuario sin privilegios de sudo
useradd -m -s /bin/bash uh-social
# Establecer contraseña
passwd uh-social

# Crear directorio de la app
mkdir -p /var/www/uh-socialdash
chown uh-social:uh-social /var/www/uh-socialdash
```

### 4.2 Clonar Repositorio

**Opción A: Desde GitHub**
```bash
# Cambiar al usuario de la app
su - uh-social

# Clonar repositorio
cd /var/www
git clone https://github.com/TU_USUARIO/uh-socialdash.git
cd uh-socialdash

# Si usas SSH key para GitHub
git clone git@github.com:TU_USUARIO/uh-socialdash.git
```

**Opción B: Subir Archivos Localmente**
```bash
# Desde tu máquina local
scp -r uh-socialdash root@TU_IP_VPS:/tmp/

# En el VPS
mv /tmp/uh-socialdash /var/www/
chown -R uh-social:uh-social /var/www/uh-socialdash
```

### 4.3 Instalar Dependencias
```bash
cd /var/www/uh-socialdash
npm ci --production=false
```

---

## 🔐 Paso 5: Configurar Entorno de Producción

### 5.1 Generar Clave de Encriptación
```bash
# Generar clave aleatoria de 32 bytes
openssl rand -base64 32
```

Guarda este resultado, lo necesitarás en el siguiente paso.

### 5.2 Crear Archivo .env de Producción
```bash
nano /var/www/uh-socialdash/.env
```

```env
# Database
DATABASE_URL=postgresql://uh_socialdash:CONTRASEÑA_DB_AQUI@localhost:5432/uh_socialdash

# Instagram OAuth
INSTAGRAM_APP_ID=TU_APP_ID
INSTAGRAM_APP_SECRET=TU_APP_SECRET
INSTAGRAM_REDIRECT_URI=https://tu-dominio.com/api/auth/callback

# Encryption (usa la clave generada arriba)
ENCRYPTION_KEY=TU_CLAVE_ENCRYPTACIÓN_32_BYTES_BASE64

# App
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
NODE_ENV=production

# Port
PORT=3000
```

**⚠️ IMPORTANTE**: Reemplaza todos los valores con tus credenciales reales.

### 5.3 Permisos del Archivo .env
```bash
chmod 600 /var/www/uh-socialdash/.env
chown uh-social:uh-social /var/www/uh-socialdash/.env
```

---

## 🏗️ Paso 6: Build de Producción

### 6.1 Compilar Aplicación
```bash
cd /var/www/uh-socialdash
npm run build
```

Este proceso puede tomar varios minutos.

### 6.2 Verificar Build
```bash
# Debería ver la carpeta .next creada
ls -la .next/
```

---

## ⚙️ Paso 7: Configurar Systemd Service

### 7.1 Crear Archivo de Servicio
```bash
nano /etc/systemd/system/uh-socialdash.service
```

```ini
[Unit]
Description=UH SocialDash - Instagram Analytics Dashboard
After=network.target postgresql.service

[Service]
Type=simple
User=uh-social
WorkingDirectory=/var/www/uh-socialdash
ExecStart=/usr/bin/node /var/www/uh-socialdash/node_modules/.bin/next start
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=uh-socialdash

# Environment
Environment="NODE_ENV=production"
Environment="PORT=3000"

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

### 7.2 Habilitar y Arrancar Servicio
```bash
# Recargar systemd
systemctl daemon-reload

# Habilitar servicio para inicio automático
systemctl enable uh-socialdash

# Iniciar servicio
systemctl start uh-socialdash

# Verificar estado
systemctl status uh-socialdash
```

Deberías ver algo como:
```
● uh-socialdash.service - UH SocialDash
     Loaded: loaded (/etc/systemd/system/uh-socialdash.service; enabled)
     Active: active (running) since ...
```

### 7.3 Verificar Logs
```bash
# Ver logs en tiempo real
journalctl -u uh-socialdash -f

# Ver últimos 50 logs
journalctl -u uh-socialdash -n 50
```

---

## 🌐 Paso 8: Configurar Nginx Reverse Proxy

### 8.1 Crear Configuración de Nginx
```bash
nano /etc/nginx/sites-available/uh-socialdash
```

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name tu-dominio.com www.tu-dominio.com;

    # Redirigir HTTP a HTTPS (después de configurar SSL)
    # return 301 https://$server_name$request_uri;

    # Proxy a Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Optimización para archivos estáticos
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # Límite de tamaño para subidas
    client_max_body_size 10M;
}
```

**⚠️ IMPORTANTE**: Reemplaza `tu-dominio.com` con tu dominio real.

### 8.2 Habilitar Sitio
```bash
# Crear enlace simbólico
ln -s /etc/nginx/sites-available/uh-socialdash /etc/nginx/sites-enabled/

# Probar configuración
nginx -t

# Recargar Nginx
systemctl reload nginx
```

---

## 🔒 Paso 9: Configurar SSL con Let's Encrypt

### 9.1 Instalar Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### 9.2 Obtener Certificado SSL
```bash
certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

Sigue las instrucciones:
1. Ingresa tu email
2. Acepta los términos
3. Elige si redirigir HTTP a HTTPS (recomendado: **Yes**)

### 9.3 Verificar Renovación Automática
```bash
# Verificar timer de systemd
systemctl status certbot.timer

# Simular renovación
certbot renew --dry-run
```

Certbot renovará automáticamente tu certificado antes de expirar.

---

## ⏰ Paso 10: Configurar Cron Jobs de Producción

### 10.1 Instalar Dependencia de Cron
```bash
cd /var/www/uh-socialdash
npm install node-cron
```

### 10.2 Crear Script de Inicialización
Crea `/var/www/uh-socialdash/scripts/start-schedulers.js`:

```javascript
require('dotenv').config({ path: '/var/www/uh-socialdash/.env' })

const {
  startInstagramSyncScheduler,
  startTokenRefreshScheduler
} = require('../jobs/instagram-scheduler')

console.log('Starting production schedulers...')

startInstagramSyncScheduler()
  .then(() => console.log('✓ Instagram sync scheduler started'))
  .catch(err => console.error('✗ Failed to start sync scheduler:', err))

startTokenRefreshScheduler()
  .then(() => console.log('✓ Token refresh scheduler started'))
  .catch(err => console.error('✗ Failed to start token refresh scheduler:', err))

// Mantener proceso vivo
console.log('Schedulers are running. Press Ctrl+C to stop.')
```

### 10.3 Crear Servicios Systemd para Schedulers

**Servicio de Data Sync:**
```bash
nano /etc/systemd/system/uh-socialdash-sync.service
```

```ini
[Unit]
Description=UH SocialDash - Instagram Data Sync
After=network.target postgresql.service uh-socialdash.service

[Service]
Type=simple
User=uh-social
WorkingDirectory=/var/www/uh-socialdash
ExecStart=/usr/bin/node scripts/start-schedulers.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=uh-socialdash-sync

[Install]
WantedBy=multi-user.target
```

**Habilitar y Arrancar:**
```bash
systemctl daemon-reload
systemctl enable uh-socialdash-sync
systemctl start uh-socialdash-sync
systemctl status uh-socialdash-sync
```

### 10.4 Alternativa: Cron del Sistema

Si prefieres usar cron del sistema en lugar de node-cron:

```bash
# Editar crontab del usuario uh-social
crontab -e -u uh-social
```

```cron
# Sincronizar datos de Instagram todos los días a las 2:00 AM UTC
0 2 * * * cd /var/www/uh-socialdash && npm run sync:instagram >> /var/log/uh-socialdash-sync.log 2>&1

# Refrescar tokens todos los días a las 3:00 AM UTC
0 3 * * * cd /var/www/uh-socialdash && npm run refresh:tokens >> /var/log/uh-socialdash-refresh.log 2>&1
```

---

## 🔍 Paso 11: Verificación y Pruebas

### 11.1 Verificar Servicio Principal
```bash
# Estado del servicio
systemctl status uh-socialdash

# Logs recientes
journalctl -u uh-socialdash -n 50 --lines 50
```

### 11.2 Verificar Nginx
```bash
# Estado de Nginx
systemctl status nginx

# Logs de acceso
tail -f /var/log/nginx/access.log

# Logs de error
tail -f /var/log/nginx/error.log
```

### 11.3 Probar la Aplicación
1. Abre tu navegador: `https://tu-dominio.com`
2. Deberías ver la página de login de Instagram
3. Verifica que todos los assets carguen correctamente

### 11.4 Probar Conexión a Instagram
1. Haz clic en "Connect Instagram"
2. Autoriza la aplicación
3. Verifica que seas redirigido al dashboard
4. Verifica que los datos se muestren correctamente

---

## 📊 Paso 12: Monitoreo y Mantenimiento

### 12.1 Verificar Espacio en Disco
```bash
df -h
```

### 12.2 Verificar Uso de Recursos
```bash
# CPU y RAM
htop

# Si no está instalado
apt install -y htop
```

### 12.3 Verificar Logs de la Aplicación
```bash
# Logs del servicio
journalctl -u uh-socialdash -f

# Logs de sincronización
journalctl -u uh-socialdash-sync -f
```

### 12.4 Backups de Base de Datos
Crear script de backup `/var/www/uh-socialdash/scripts/backup-db.sh`:

```bash
#!/bin/bash
# Configuración
BACKUP_DIR="/var/backups/uh-socialdash"
DB_NAME="uh_socialdash"
DB_USER="uh_socialdash"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/uh_socialdash_$DATE.sql.gz"

# Crear directorio de backup
mkdir -p $BACKUP_DIR

# Hacer backup
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

# Mantener solo los últimos 7 días
find $BACKUP_DIR -name "uh_socialdash_*.sql.gz" -mtime +7 -delete

echo "Backup completado: $BACKUP_FILE"
```

Dar permisos y agregar a crontab:
```bash
chmod +x /var/www/uh-socialdash/scripts/backup-db.sh

# Editar crontab
crontab -e

# Agregar: Backup diario a las 4:00 AM
0 4 * * * /var/www/uh-socialdash/scripts/backup-db.sh
```

---

## 🔧 Paso 13: Actualización de la Aplicación

### 13.1 Proceso de Actualización
```bash
# Como usuario uh-social
su - uh-social
cd /var/www/uh-socialdash

# Hacer pull de los cambios
git pull origin main

# Instalar nuevas dependencias
npm ci

# Build de producción
npm run build

# Reiniciar servicio
sudo systemctl restart uh-socialdash
```

### 13.2 Rollback si Algo Falla
```bash
# Ver commits anteriores
git log --oneline

# Volver a versión anterior
git checkout COMMIT_HASH_ANTERIOR

# Rebuild y restart
npm run build
sudo systemctl restart uh-socialdash
```

---

## 🛡️ Paso 14: Seguridad Adicional

### 14.1 Configurar Firewall (UFW)
```bash
# Instalar UFW
apt install -y ufw

# Configurar reglas
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Habilitar firewall
ufw enable

# Verificar estado
ufw status
```

### 14.2 Configurar Fail2Ban (Protección contra Ataques de Fuerza Bruta)
```bash
apt install -y fail2ban

# Crear configuración local
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Editar configuración
nano /etc/fail2ban/jail.local
```

```ini
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
```

```bash
# Reiniciar fail2ban
systemctl restart fail2ban
systemctl enable fail2ban
```

### 14.3 Restringir Acceso por IP (Opcional)
Si conoces tu IP estática, puedes restringir acceso SSH:

```bash
# Editar configuración SSH
nano /etc/ssh/sshd_config

# Agregar al final
AllowUsers TU_USUARIO@TU_IP_ESTICA
```

```bash
# Reiniciar SSH
systemctl restart sshd
```

---

## 🚨 Troubleshooting

### Problema: Servicio no inicia
```bash
# Ver logs detallados
journalctl -u uh-socialdash -n 100

# Verificar que el puerto 3000 esté libre
netstat -tlnp | grep 3000

# Verificar que PostgreSQL esté corriendo
systemctl status postgresql
```

### Problema: Error de conexión a base de datos
```bash
# Verificar conexión a PostgreSQL
sudo -u uh_socialdash psql -d uh_socialdash -c "SELECT 1;"

# Verificar que DATABASE_URL sea correcta
cat /var/www/uh-socialdash/.env | grep DATABASE_URL
```

### Problema: Error de Instagram OAuth
1. Verifica que `INSTAGRAM_REDIRECT_URI` coincida exactamente en:
   - Meta Developer Dashboard
   - Archivo `.env`
   - Configuración de Nginx

2. Verifica que tu Instagram App esté en modo **Live** (no Development)

### Problema: Los datos no se sincronizan
```bash
# Verificar servicio de sincronización
systemctl status uh-socialdash-sync

# Ver logs de sincronización
journalctl -u uh-socialdash-sync -n 50

# Ejecutar sincronización manual
cd /var/www/uh-socialdash
npm run sync:instagram
```

### Problema: Certificado SSL expirado
```bash
# Renovar manualmente
certbot renew

# Recargar nginx
systemctl reload nginx
```

### Problema: 502 Bad Gateway
```bash
# Verificar que Next.js esté corriendo
systemctl status uh-socialdash

# Verificar que el puerto 3000 esté escuchando
netstat -tlnp | grep 3000

# Verificar configuración de nginx
nginx -t
```

---

## 📚 Comandos Útiles

### Gestión de Servicios
```bash
# Ver estado de todos los servicios
systemctl status uh-socialdash uh-socialdash-sync nginx postgresql

# Reiniciar servicios
systemctl restart uh-socialdash
systemctl restart uh-socialdash-sync
systemctl restart nginx

# Ver logs en tiempo real
journalctl -u uh-socialdash -f
journalctl -u uh-socialdash-sync -f
journalctl -u nginx -f
```

### Gestión de Base de Datos
```bash
# Conectar a PostgreSQL
sudo -u uh_socialdash psql -d uh_socialdash

# Ver tablas
\dt

# Ver registros de instagram_profiles
SELECT * FROM instagram_profiles;

# Salir
\q
```

### Gestión de Logs
```bash
# Logs de la aplicación
journalctl -u uh-socialdash --since "1 hour ago"

# Logs de nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs de PostgreSQL
tail -f /var/log/postgresql/postgresql-16-main.log
```

---

## ✅ Checklist Pre-Despliegue

Antes de considerar el despliegue completo, verifica:

- [ ] VPS tiene recursos suficientes (2GB+ RAM)
- [ ] Node.js 20.x instalado
- [ ] PostgreSQL 16 instalado y corriendo
- [ ] Base de datos y usuario creados
- [ ] Instagram App configurada en Meta Developers
- [ ] Archivo `.env` configurado con todos los valores
- [ ] Clave de encriptación generada y configurada
- [ ] Aplicación compilada con `npm run build`
- [ ] Systemd services configurados y corriendo
- [ ] Nginx configurado como reverse proxy
- [ ] Certificado SSL instalado y funcionando
- [ ] Cron jobs configurados para sincronización
- [ ] Firewall configurado (UFW)
- [ ] Fail2ban instalado y corriendo
- [ ] Script de backup configurado
- [ ] Aplicación accesible vía HTTPS
- [ ] OAuth de Instagram funciona correctamente
- [ ] Datos se sincronizan correctamente
- [ ] Monitoreo de logs configurado

---

## 🎯 Checklist Post-Despliegue

Después del despliegue exitoso:

- [ ] Verificar que el servicio inicia automáticamente al reiniciar
- [ ] Configurar alertas de monitoreo (opcional)
- [ ] Documentar credenciales y configuraciones
- [ ] Configurar DNS para el dominio (si aplica)
- [ ] Configurar backups externos (opcional)
- [ ] Establecer proceso de actualización
- [ ] Configurar entorno de staging (opcional)
- [ ] Configurar CDN para assets estáticos (opcional)
- [ ] Optimizar rendimiento de PostgreSQL
- [ ] Configurar monitoreo de recursos (htop, netdata, etc.)

---

## 📞 Soporte

Si encuentras problemas:

1. Verifica los logs de cada servicio
2. Consulta la sección de Troubleshooting
3. Revisa la documentación de:
   - [Next.js Deployment](https://nextjs.org/docs/deployment)
   - [PostgreSQL Documentation](https://www.postgresql.org/docs/)
   - [Nginx Documentation](https://nginx.org/en/docs/)
   - [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)

---

## 🔄 Próximos Pasos Opcionales

1. **Configurar CDN** (Cloudflare) para mejorar rendimiento
2. **Implementar monitoreo** (Sentry para errores, Datadog para métricas)
3. **Configurar replicas** para alta disponibilidad
4. **Implementar caché** (Redis) para respuestas más rápidas
5. **Configurar CI/CD** para despliegues automatizados
6. **Optimizar PostgreSQL** para mejor rendimiento
7. **Configurar backups externos** (S3, Google Cloud Storage)

---

**Última actualización**: 2025-01-16
**Versión**: 1.0.0
