#!/bin/bash
#═══════════════════════════════════════════════════════════════════════════════
# BetelMarket Hosting Panel — Full Server Setup Script
# Run on a FRESH Ubuntu 24.04 VPS (Contabo Cloud VPS 30 recommended)
#
# Usage:
#   chmod +x setup.sh
#   sudo ./setup.sh --domain panel.tudominio.com --email admin@tudominio.com
#═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ─── PARSE ARGUMENTS ─────────────────────────────────────────────────────────
PANEL_DOMAIN=""
ADMIN_EMAIL=""
HESTIA_PASSWORD=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --domain) PANEL_DOMAIN="$2"; shift 2 ;;
    --email) ADMIN_EMAIL="$2"; shift 2 ;;
    --password) HESTIA_PASSWORD="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [ -z "$PANEL_DOMAIN" ] || [ -z "$ADMIN_EMAIL" ]; then
  echo "Usage: sudo ./setup.sh --domain panel.tudominio.com --email admin@tudominio.com [--password yourpass]"
  exit 1
fi

if [ -z "$HESTIA_PASSWORD" ]; then
  HESTIA_PASSWORD=$(openssl rand -base64 16)
fi

SERVER_IP=$(curl -s ifconfig.me)

echo "═══════════════════════════════════════════════════════════════"
echo " BetelMarket Server Setup"
echo " Domain:   $PANEL_DOMAIN"
echo " Email:    $ADMIN_EMAIL"
echo " IP:       $SERVER_IP"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ─── 1. SYSTEM UPDATE ────────────────────────────────────────────────────────
echo "[1/9] Updating system..."
apt update && apt upgrade -y
apt install -y curl wget git unzip software-properties-common \
  apt-transport-https ca-certificates gnupg lsb-release

# ─── 2. INSTALL HESTIACP ────────────────────────────────────────────────────
echo "[2/9] Installing HestiaCP..."
wget https://raw.githubusercontent.com/hestiacp/hestiacp/release/install/hst-install.sh -O /tmp/hst-install.sh

bash /tmp/hst-install.sh \
  --interactive no \
  --hostname "$PANEL_DOMAIN" \
  --email "$ADMIN_EMAIL" \
  --password "$HESTIA_PASSWORD" \
  --apache no \
  --phpfpm yes \
  --multiphp yes \
  --vsftpd no \
  --proftpd no \
  --named yes \
  --mysql no \
  --postgresql yes \
  --exim yes \
  --dovecot yes \
  --sieve yes \
  --clamav yes \
  --spamassassin yes \
  --iptables yes \
  --fail2ban yes \
  --api yes \
  --port 8083 \
  --lang en \
  --force

echo "HestiaCP installed. Admin password: $HESTIA_PASSWORD"

# ─── 3. INSTALL DOCKER ──────────────────────────────────────────────────────
echo "[3/9] Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

systemctl enable docker
systemctl start docker

# ─── 4. INSTALL NODE.JS (for client apps) ───────────────────────────────────
echo "[4/9] Installing Node.js 20 + PM2..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2

# ─── 5. INSTALL WP-CLI ──────────────────────────────────────────────────────
echo "[5/9] Installing WP-CLI..."
curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
chmod +x wp-cli.phar
mv wp-cli.phar /usr/local/bin/wp

# ─── 6. INSTALL IMAPSYNC (for mail migration) ───────────────────────────────
echo "[6/9] Installing imapsync..."
apt install -y imapsync

# ─── 7. CLONE BETELMARKET APP ───────────────────────────────────────────────
echo "[7/9] Setting up BetelMarket application..."
mkdir -p /opt/betelmarket
cd /opt/betelmarket

# Clone your repo (update URL)
# git clone https://github.com/your-user/betelmarket-host.git .
# For now, we'll create the structure:
mkdir -p backend frontend

# Create production .env for backend
cat > backend/.env <<EOF
APP_NAME=BetelMarket
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://$PANEL_DOMAIN

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=betelmarket
DB_USERNAME=betelmarket
DB_PASSWORD=$(openssl rand -base64 24)

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

QUEUE_CONNECTION=redis

HESTIA_HOST=127.0.0.1
HESTIA_PORT=8083
HESTIA_ADMIN_USER=admin
HESTIA_ADMIN_PASSWORD=$HESTIA_PASSWORD
HESTIA_USE_API=true

SANCTUM_STATEFUL_DOMAINS=$PANEL_DOMAIN
SESSION_DOMAIN=$PANEL_DOMAIN
EOF

# Create PostgreSQL database
echo "[7/9] Creating database..."
sudo -u postgres psql -c "CREATE USER betelmarket WITH PASSWORD '$(grep DB_PASSWORD backend/.env | cut -d= -f2)';"
sudo -u postgres psql -c "CREATE DATABASE betelmarket OWNER betelmarket;"

# ─── 8. DOCKER COMPOSE PRODUCTION ───────────────────────────────────────────
echo "[8/9] Starting Docker services..."
cat > docker-compose.yml <<'COMPOSE'
version: "3.8"

services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    ports:
      - "127.0.0.1:8000:8000"
    depends_on:
      - redis
    env_file:
      - ./backend/.env
    volumes:
      - ./backend:/var/www/html

  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    depends_on:
      - redis
    env_file:
      - ./backend/.env
    volumes:
      - ./backend:/var/www/html
    command: php artisan queue:work --sleep=3 --tries=3 --max-time=3600

  scheduler:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    depends_on:
      - redis
    env_file:
      - ./backend/.env
    volumes:
      - ./backend:/var/www/html
    command: >
      sh -c "while true; do php artisan schedule:run --verbose --no-interaction; sleep 60; done"

volumes:
  redis_data:
COMPOSE

# ─── 9. NGINX PROXY + SSL ───────────────────────────────────────────────────
echo "[9/9] Configuring Nginx reverse proxy + SSL..."

# Create Nginx config for the panel domain
cat > /etc/nginx/conf.d/betelmarket-panel.conf <<EOF
server {
    listen 80;
    server_name $PANEL_DOMAIN;

    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Frontend (static build)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

nginx -t && systemctl reload nginx

# SSL via Let's Encrypt (certbot)
apt install -y certbot python3-certbot-nginx
certbot --nginx -d "$PANEL_DOMAIN" --non-interactive --agree-tos --email "$ADMIN_EMAIL"

# ─── FIREWALL RULES ─────────────────────────────────────────────────────────
echo "Configuring firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 8083/tcp  # HestiaCP panel
ufw allow 25/tcp    # SMTP
ufw allow 110/tcp   # POP3
ufw allow 143/tcp   # IMAP
ufw allow 465/tcp   # SMTPS
ufw allow 587/tcp   # Submission
ufw allow 993/tcp   # IMAPS
ufw allow 995/tcp   # POP3S
ufw allow 53/tcp    # DNS
ufw allow 53/udp    # DNS
ufw --force enable

# ─── DONE ────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " ✅ BetelMarket Setup Complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo " Panel URL:     https://$PANEL_DOMAIN"
echo " HestiaCP:      https://$SERVER_IP:8083"
echo " Hestia User:   admin"
echo " Hestia Pass:   $HESTIA_PASSWORD"
echo " Server IP:     $SERVER_IP"
echo ""
echo " Next steps:"
echo "  1. Point $PANEL_DOMAIN DNS A record to $SERVER_IP"
echo "  2. Clone your repo to /opt/betelmarket"
echo "  3. Run: cd /opt/betelmarket && docker compose up -d"
echo "  4. Run: cd backend && php artisan migrate --seed"
echo ""
echo " Save these credentials securely!"
echo "═══════════════════════════════════════════════════════════════"

# Save credentials
cat > /root/.betelmarket-credentials <<EOF
Panel: https://$PANEL_DOMAIN
HestiaCP: https://$SERVER_IP:8083
Admin User: admin
Admin Password: $HESTIA_PASSWORD
DB Password: $(grep DB_PASSWORD /opt/betelmarket/backend/.env | cut -d= -f2)
Server IP: $SERVER_IP
EOF
chmod 600 /root/.betelmarket-credentials
