#!/bin/bash

###############################################################################
# Script de Configuración de Cron Jobs - UH SocialDash
#
# Configura los trabajos automáticos de sincronización de datos
#
# Uso:
#   chmod +x setup-cron.sh
#   ./setup-cron.sh
###############################################################################

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que se ejecuta como root
if [[ $EUID -ne 0 ]]; then
   print_error "Este script debe ejecutarse como root (use sudo)"
   exit 1
fi

print_info "Configurando cron jobs para UH SocialDash..."

# Directorio de la aplicación
APP_DIR="/var/www/uh-socialdash"
LOG_DIR="/var/log/uh-socialdash"
USER="uh-social"

# Verificar que la aplicación existe
if [ ! -d "$APP_DIR" ]; then
    print_error "La aplicación no existe en $APP_DIR"
    print_info "Ejecuta primero el script de despliegue principal"
    exit 1
fi

# Crear directorio de logs
mkdir -p "$LOG_DIR"
chown $USER:$USER "$LOG_DIR"

###############################################################################
# Opción 1: Usar node-cron (integrado en la aplicación)
###############################################################################
print_info "Creando script de inicio de schedulers..."

cat > "$APP_DIR/scripts/start-schedulers.js" <<'CRON_SCRIPT'
require('dotenv').config({ path: '/var/www/uh-socialdash/.env' })

const {
  startInstagramSyncScheduler,
  startTokenRefreshScheduler
} = require('../jobs/instagram-scheduler')

console.log('Starting production schedulers...')
console.log('Timestamp:', new Date().toISOString())

startInstagramSyncScheduler()
  .then(() => console.log('✓ Instagram sync scheduler started'))
  .catch(err => {
    console.error('✗ Failed to start sync scheduler:', err)
    process.exit(1)
  })

startTokenRefreshScheduler()
  .then(() => console.log('✓ Token refresh scheduler started'))
  .catch(err => {
    console.error('✗ Failed to start token refresh scheduler:', err)
    process.exit(1)
  })

console.log('Schedulers are running.')
console.log('- Instagram data sync: Daily at 2:00 AM UTC')
console.log('- Token refresh: Daily at 3:00 AM UTC')
console.log('Press Ctrl+C to stop.')

// Manejar shutdown gracefully
process.on('SIGINT', () => {
  console.log('\nShutting down schedulers...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\nShutting down schedulers...')
  process.exit(0)
})
CRON_SCRIPT

chown $USER:$USER "$APP_DIR/scripts/start-schedulers.js"
chmod +x "$APP_DIR/scripts/start-schedulers.js"

###############################################################################
# Crear servicio systemd
###############################################################################
print_info "Creando servicio systemd para schedulers..."

cat > /etc/systemd/system/uh-socialdash-sync.service <<EOF
[Unit]
Description=UH SocialDash - Instagram Data Sync & Token Refresh
After=network.target postgresql.service uh-socialdash.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node $APP_DIR/scripts/start-schedulers.js
Restart=on-failure
RestartSec=10
StandardOutput=append:$LOG_DIR/sync-output.log
StandardError=append:$LOG_DIR/sync-error.log
SyslogIdentifier=uh-socialdash-sync

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable uh-socialdash-sync
systemctl start uh-socialdash-sync

sleep 3

if systemctl is-active --quiet uh-socialdash-sync; then
    print_info "✓ Servicio de sincronización iniciado correctamente"
else
    print_error "✗ Error al iniciar servicio de sincronización"
    journalctl -u uh-socialdash-sync -n 20
    exit 1
fi

###############################################################################
# Opción 2: Cron del sistema (alternativa)
###############################################################################
print_warning "Opcional: Configurar cron del sistema como alternativa"
read -p "¿Deseas configurar cron del sistema también? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Configurando cron del sistema..."

    # Crear scripts para cron
    cat > "$APP_DIR/scripts/sync-instagram.sh" <<'EOF'
#!/bin/bash
cd /var/www/uh-socialdash
source .env
/usr/bin/node scripts/manual-sync.js >> /var/log/uh-socialdash/instagram-sync.log 2>&1
EOF

    cat > "$APP_DIR/scripts/refresh-tokens.sh" <<'EOF'
#!/bin/bash
cd /var/www/uh-socialdash
source .env
curl -X POST http://localhost:3000/api/auth/refresh >> /var/log/uh-socialdash/token-refresh.log 2>&1
EOF

    chmod +x "$APP_DIR/scripts/sync-instagram.sh"
    chmod +x "$APP_DIR/scripts/refresh-tokens.sh"
    chown $USER:$USER "$APP_DIR/scripts/sync-instagram.sh"
    chown $USER:$USER "$APP_DIR/scripts/refresh-tokens.sh"

    # Configurar crontab
    crontab -u $USER -l > /tmp/crontab-$USER 2>/dev/null || touch /tmp/crontab-$USER

    # Agregar jobs si no existen
    if ! grep -q "sync-instagram.sh" /tmp/crontab-$USER; then
        echo "# Instagram data sync - Daily at 2:00 AM UTC" >> /tmp/crontab-$USER
        echo "0 2 * * * $APP_DIR/scripts/sync-instagram.sh" >> /tmp/crontab-$USER
    fi

    if ! grep -q "refresh-tokens.sh" /tmp/crontab-$USER; then
        echo "# Token refresh - Daily at 3:00 AM UTC" >> /tmp/crontab-$USER
        echo "0 3 * * * $APP_DIR/scripts/refresh-tokens.sh" >> /tmp/crontab-$USER
    fi

    # Instalar crontab
    crontab -u $USER /tmp/crontab-$USER
    rm /tmp/crontab-$USER

    print_info "✓ Cron del sistema configurado"
fi

###############################################################################
# Script de sincronización manual
###############################################################################
print_info "Creando script de sincronización manual..."

cat > "$APP_DIR/scripts/manual-sync.js" <<'EOF'
require('dotenv').config({ path: '/var/www/uh-socialdash/.env' })

const { db } = require('./lib/db')
const { instagramProfiles } = require('./lib/db/schema')
const { eq } = require('drizzle-orm')
const { InstagramService } = require('./lib/services/instagram-service')

async function manualSync() {
  console.log('Starting manual Instagram sync...')
  console.log('Timestamp:', new Date().toISOString())

  try {
    const profiles = await db.query.instagramProfiles.findMany({
      where: eq(instagramProfiles.isActive, true),
    })

    console.log(`Found ${profiles.length} active profile(s)`)

    for (const profile of profiles) {
      if (!profile.accessToken) continue

      try {
        console.log(`Syncing profile: ${profile.username}`)

        const service = new InstagramService(profile.accessToken)
        await service.syncProfileData(profile.id)
        await service.syncMediaData(profile.id)
        await service.syncUserInsights(profile.id)

        console.log(`✓ Synced: ${profile.username}`)
      } catch (error) {
        console.error(`✗ Failed to sync ${profile.username}:`, error.message)
      }
    }

    console.log('Manual sync completed')
  } catch (error) {
    console.error('Manual sync failed:', error)
    process.exit(1)
  }
}

manualSync()
EOF

chown $USER:$USER "$APP_DIR/scripts/manual-sync.js"
chmod +x "$APP_DIR/scripts/manual-sync.js"

###############################################################################
# Script de backup de base de datos
###############################################################################
print_info "Creando script de backup de base de datos..."

DB_PASSWORD=$(grep DATABASE_URL "$APP_DIR/.env" | cut -d':' -f3 | cut -d'@' -f1)

cat > "$APP_DIR/scripts/backup-db.sh" <<EOF
#!/bin/bash
# Script de backup automático de base de datos
# UH SocialDash

BACKUP_DIR="/var/backups/uh-socialdash"
DB_NAME="uh_socialdash"
DB_USER="uh_socialdash"
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="\$BACKUP_DIR/uh_socialdash_\$DATE.sql.gz"
RETENTION_DAYS=7

# Crear directorio de backup
mkdir -p \$BACKUP_DIR

# Hacer backup
echo "Starting database backup..."
PGPASSWORD='$DB_PASSWORD' pg_dump -U \$DB_USER -h localhost \$DB_NAME | gzip > \$BACKUP_FILE

if [ \$? -eq 0 ]; then
    echo "✓ Backup completed: \$BACKUP_FILE"

    # Calcular tamaño
    SIZE=\$(du -h \$BACKUP_FILE | cut -f1)
    echo "  Size: \$SIZE"

    # Mantener solo los últimos X días
    find \$BACKUP_DIR -name "uh_socialdash_*.sql.gz" -mtime +\$RETENTION_DAYS -delete

    # Limpiar backups antiguos
    COUNT=\$(ls \$BACKUP_DIR/uh_socialdash_*.sql.gz 2>/dev/null | wc -l)
    echo "  Total backups: \$COUNT"
else
    echo "✗ Backup failed"
    exit 1
fi
EOF

chown $USER:$USER "$APP_DIR/scripts/backup-db.sh"
chmod +x "$APP_DIR/scripts/backup-db.sh"

# Agregar al crontab
crontab -u $USER -l > /tmp/crontab-$USER 2>/dev/null || touch /tmp/crontab-$USER

if ! grep -q "backup-db.sh" /tmp/crontab-$USER; then
    echo "# Database backup - Daily at 4:00 AM UTC" >> /tmp/crontab-$USER
    echo "0 4 * * * $APP_DIR/scripts/backup-db.sh" >> /tmp/crontab-$USER
    crontab -u $USER /tmp/crontab-$USER
    print_info "✓ Backup automático configurado (diario a las 4:00 AM UTC)"
fi

rm /tmp/crontab-$USER

###############################################################################
# Información final
###############################################################################
clear
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}¡Configuración de Cron Completada!${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo "SERVICIOS CONFIGURADOS:"
echo
echo "1. Sincronización de Instagram (node-cron)"
echo "   - Servicio: uh-socialdash-sync"
echo "   - Horario: 2:00 AM UTC (diario)"
echo "   - Logs: $LOG_DIR/sync-output.log"
echo
echo "2. Refresco de Tokens (node-cron)"
echo "   - Servicio: uh-socialdash-sync"
echo "   - Horario: 3:00 AM UTC (diario)"
echo "   - Logs: $LOG_DIR/sync-error.log"
echo
echo "3. Backup de Base de Datos"
echo "   - Horario: 4:00 AM UTC (diario)"
echo "   - Retención: 7 días"
echo "   - Directorio: /var/backups/uh-socialdash"
echo
echo "COMANDOS ÚTILES:"
echo
echo "Ver estado de sincronización:"
echo "  systemctl status uh-socialdash-sync"
echo
echo "Ver logs de sincronización:"
echo "  tail -f $LOG_DIR/sync-output.log"
echo "  tail -f $LOG_DIR/sync-error.log"
echo
echo "Sincronización manual:"
echo "  sudo -u $USER $APP_DIR/scripts/manual-sync.js"
echo
echo "Backup manual de base de datos:"
echo "  sudo -u $USER $APP_DIR/scripts/backup-db.sh"
echo
echo "Ver crontab del usuario:"
echo "  crontab -u $USER -l"
echo
echo "LISTAR BACKUPS:"
echo "  ls -lh /var/backups/uh-socialdash/"
echo
echo "RESTAURAR BACKUP:"
echo "  gunzip < /var/backups/uh-socialdash/uh_socialdash_FECHA.sql.gz | psql -U uh_socialdash uh_socialdash"
echo
echo -e "${GREEN}========================================${NC}"
