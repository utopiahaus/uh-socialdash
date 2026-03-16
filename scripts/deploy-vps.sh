#!/bin/bash

###############################################################################
# Script de Despliegue Automatizado - UH SocialDash
# Hostinger VPS - Ubuntu 22.04/24.04
#
# Uso:
#   chmod +x deploy-vps.sh
#   ./deploy-vps.sh
###############################################################################

set -e  # Detener script si algún comando falla

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
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

print_info "Iniciando despliegue de UH SocialDash..."

###############################################################################
# Paso 1: Actualizar sistema
###############################################################################
print_info "Actualizando sistema..."
apt update && apt upgrade -y

###############################################################################
# Paso 2: Instalar dependencias
###############################################################################
print_info "Instalando dependencias..."
apt install -y curl wget git unzip build-essential software-properties-common ufw fail2ban

###############################################################################
# Paso 3: Instalar Node.js 20.x
###############################################################################
print_info "Instalando Node.js 20.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    print_info "Node.js $(node --version) instalado"
else
    print_info "Node.js ya está instalado: $(node --version)"
fi

###############################################################################
# Paso 4: Instalar PostgreSQL 16
###############################################################################
print_info "Instalando PostgreSQL 16..."
if ! command -v psql &> /dev/null; then
    apt install -y postgresql-16 postgresql-contrib-16
    systemctl start postgresql
    systemctl enable postgresql
    print_info "PostgreSQL 16 instalado"
else
    print_info "PostgreSQL ya está instalado"
fi

###############################################################################
# Paso 5: Instalar Nginx
###############################################################################
print_info "Instalando Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    print_info "Nginx instalado"
else
    print_info "Nginx ya está instalado"
fi

###############################################################################
# Paso 6: Instalar PM2
###############################################################################
print_info "Instalando PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    print_info "PM2 instalado"
else
    print_info "PM2 ya está instalado"
fi

###############################################################################
# Paso 7: Solicitar información de configuración
###############################################################################
print_info "Configuración de la aplicación..."

# Dominio
read -p "Ingresa tu dominio (ej: tu-dominio.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    print_error "El dominio es requerido"
    exit 1
fi

# Contraseña de base de datos
read -sp "Ingresa contraseña para PostgreSQL (deja vacío para generar automática): " DB_PASSWORD
echo
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(openssl rand -base64 32)
    print_warning "Contraseña de base de datos generada: $DB_PASSWORD"
fi

# Clave de encriptación
read -sp "Ingresa clave de encriptación (deja vacío para generar automática): " ENCRYPTION_KEY
echo
if [ -z "$ENCRYPTION_KEY" ]; then
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    print_warning "Clave de encriptación generada: $ENCRYPTION_KEY"
fi

# Instagram App credentials
read -p "Ingresa tu Instagram App ID: " INSTAGRAM_APP_ID
if [ -z "$INSTAGRAM_APP_ID" ]; then
    print_error "Instagram App ID es requerido"
    exit 1
fi

read -sp "Ingresa tu Instagram App Secret: " INSTAGRAM_APP_SECRET
echo
if [ -z "$INSTAGRAM_APP_SECRET" ]; then
    print_error "Instagram App Secret es requerido"
    exit 1
fi

# Usuario de GitHub (para clonar repositorio)
read -p "Ingresa tu usuario de GitHub: " GITHUB_USERNAME
if [ -z "$GITHUB_USERNAME" ]; then
    print_error "Usuario de GitHub es requerido"
    exit 1
fi

# Nombre del repositorio
REPO_NAME="uh-socialdash"

###############################################################################
# Paso 8: Configurar PostgreSQL
###############################################################################
print_info "Configurando PostgreSQL..."

# Crear usuario y base de datos
sudo -u postgres psql <<EOF
CREATE USER uh_socialdash WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
CREATE DATABASE uh_socialdash OWNER uh_socialdash;
GRANT ALL PRIVILEGES ON DATABASE uh_socialdash TO uh_socialdash;
\q
EOF

print_info "Base de datos 'uh_socialdash' creada"

###############################################################################
# Paso 9: Crear usuario de aplicación
###############################################################################
print_info "Creando usuario de aplicación..."

if ! id "uh-social" &>/dev/null; then
    useradd -m -s /bin/bash uh-social
    passwd uh-social
    print_info "Usuario 'uh-social' creado"
else
    print_info "Usuario 'uh-social' ya existe"
fi

# Crear directorio
mkdir -p /var/www/uh-socialdash
chown uh-social:uh-social /var/www/uh-socialdash

###############################################################################
# Paso 10: Clonar repositorio
###############################################################################
print_info "Clonando repositorio..."

if [ -d "/var/www/uh-socialdash/.git" ]; then
    print_info "Repositorio ya existe, haciendo pull..."
    cd /var/www/uh-socialdash
    sudo -u uh-social git pull
else
    sudo -u uh-social git clone https://github.com/$GITHUB_USERNAME/$REPO_NAME.git /var/www/uh-socialdash
fi

###############################################################################
# Paso 11: Crear archivo .env
###############################################################################
print_info "Creando archivo .env..."

cat > /var/www/uh-socialdash/.env <<EOF
# Database
DATABASE_URL=postgresql://uh_socialdash:$DB_PASSWORD@localhost:5432/uh_socialdash

# Instagram OAuth
INSTAGRAM_APP_ID=$INSTAGRAM_APP_ID
INSTAGRAM_APP_SECRET=$INSTAGRAM_APP_SECRET
INSTAGRAM_REDIRECT_URI=https://$DOMAIN/api/auth/callback

# Encryption
ENCRYPTION_KEY=$ENCRYPTION_KEY

# App
NEXT_PUBLIC_APP_URL=https://$DOMAIN
NODE_ENV=production

# Port
PORT=3000
EOF

chmod 600 /var/www/uh-socialdash/.env
chown uh-social:uh-social /var/www/uh-socialdash/.env

print_info "Archivo .env creado"

###############################################################################
# Paso 12: Instalar dependencias y build
###############################################################################
print_info "Instalando dependencias de Node..."
cd /var/www/uh-socialdash
sudo -u uh-social npm ci --production=false

print_info "Compilando aplicación..."
sudo -u uh-social npm run build

###############################################################################
# Paso 13: Crear servicio systemd
###############################################################################
print_info "Creando servicio systemd..."

cat > /etc/systemd/system/uh-socialdash.service <<EOF
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
Environment="NODE_ENV=production"
Environment="PORT=3000"
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable uh-socialdash
print_info "Servicio systemd creado"

###############################################################################
# Paso 14: Configurar Nginx
###############################################################################
print_info "Configurando Nginx..."

cat > /etc/nginx/sites-available/uh-socialdash <<EOF
server {
    listen 80;
    listen [::]:80;

    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    client_max_body_size 10M;
}
EOF

ln -sf /etc/nginx/sites-available/uh-socialdash /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

print_info "Nginx configurado"

###############################################################################
# Paso 15: Configurar Firewall
###############################################################################
print_info "Configurando firewall..."

ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

print_info "Firewall configurado"

###############################################################################
# Paso 16: Configurar Fail2Ban
###############################################################################
print_info "Configurando Fail2Ban..."

cat > /etc/fail2ban/jail.local <<EOF
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF

systemctl restart fail2ban
systemctl enable fail2ban

print_info "Fail2Ban configurado"

###############################################################################
# Paso 17: Iniciar aplicación
###############################################################################
print_info "Iniciando aplicación..."
systemctl start uh-socialdash

sleep 5

if systemctl is-active --quiet uh-socialdash; then
    print_info "Aplicación iniciada correctamente"
else
    print_error "Error al iniciar la aplicación"
    journalctl -u uh-socialdash -n 50
    exit 1
fi

###############################################################################
# Paso 18: Mostrar información importante
###############################################################################
clear
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}¡Despliegue Completado!${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo "INFORMACIÓN IMPORTANTE (guardar esto):"
echo
echo "Dominio: $DOMAIN"
echo "URL de la aplicación: https://$DOMAIN"
echo
echo "Base de datos:"
echo "  - Nombre: uh_socialdash"
echo "  - Usuario: uh_socialdash"
echo "  - Contraseña: $DB_PASSWORD"
echo
echo "Clave de encriptación: $ENCRYPTION_KEY"
echo
echo "COMANDOS ÚTILES:"
echo
echo "Ver estado de la aplicación:"
echo "  systemctl status uh-socialdash"
echo
echo "Ver logs:"
echo "  journalctl -u uh-socialdash -f"
echo
echo "Reiniciar aplicación:"
echo "  systemctl restart uh-socialdash"
echo
echo "Configurar SSL (CERTBOT):"
echo "  certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo
echo "Ver logs de Nginx:"
echo "  tail -f /var/log/nginx/access.log"
echo "  tail -f /var/log/nginx/error.log"
echo
echo -e "${YELLOW}PRÓXIMOS PASOS:${NC}"
echo
echo "1. Configurar SSL con Certbot:"
echo "   certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo
echo "2. Configurar tu Instagram App en Meta Developers:"
echo "   - Valid OAuth Redirect URI: https://$DOMAIN/api/auth/callback"
echo
echo "3. Configurar trabajos cron para sincronización de datos"
echo
echo "4. Probar la aplicación en: https://$DOMAIN"
echo
echo -e "${GREEN}========================================${NC}"
