# Guía de Deployment — BetelMarket en Contabo

## Paso 1: Comprar el VPS en Contabo

1. Ve a [contabo.com/en-us/vps](https://contabo.com/en-us/vps/)
2. Selecciona **Cloud VPS 30** (€11.20/mes):
   - 8 vCPU, 24 GB RAM, 200 GB NVMe
3. En la configuración:
   - **Region**: USA (New York) o Europe (Germany) — la más cercana a tus clientes
   - **Image**: Ubuntu 24.04
   - **Password**: Ponle un password fuerte o sube tu SSH key
   - **Networking**: Deja la IP pública que te asignen
4. Paga y espera (suele tardar 1-4 horas en activarse)
5. Recibirás un email con la IP y credenciales

## Paso 2: Conectar al servidor

```bash
ssh root@TU_IP_DEL_SERVIDOR
```

## Paso 3: Apuntar el dominio

En tu registrador de dominios (GoDaddy, Namecheap, Cloudflare, etc.):

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | panel | TU_IP_DEL_SERVIDOR |
| A | @ | TU_IP_DEL_SERVIDOR |
| A | * | TU_IP_DEL_SERVIDOR |

Espera 5-15 minutos para propagación.

## Paso 4: Subir el código al servidor

```bash
# En tu máquina local
git add . && git commit -m "deploy" && git push

# En el servidor
cd /opt
git clone https://github.com/TU_USUARIO/betelmarket-host.git betelmarket
cd betelmarket
```

## Paso 5: Ejecutar el script de instalación

```bash
chmod +x deploy/setup.sh
sudo ./deploy/setup.sh --domain panel.tudominio.com --email admin@tudominio.com
```

Este script instala automáticamente:
- ✅ HestiaCP (web server, mail server, DNS)
- ✅ PostgreSQL 16
- ✅ Redis 7
- ✅ Docker + Docker Compose
- ✅ Node.js 20 + PM2
- ✅ WP-CLI
- ✅ imapsync
- ✅ SSL (Let's Encrypt)
- ✅ Firewall (UFW + Fail2Ban)
- ✅ Nginx reverse proxy para tu panel

## Paso 6: Iniciar la aplicación

```bash
cd /opt/betelmarket

# Levantar servicios con Docker
docker compose -f deploy/docker-compose.prod.yml up -d

# Ejecutar migraciones
docker exec betelmarket-api php artisan key:generate
docker exec betelmarket-api php artisan migrate --seed --force

# Verificar que todo corre
docker compose -f deploy/docker-compose.prod.yml ps
```

## Paso 7: Verificar

- **Tu panel**: https://panel.tudominio.com
- **HestiaCP**: https://TU_IP:8083
- **API Health**: https://panel.tudominio.com/api/health

## Credenciales iniciales

Las credenciales se guardan en `/root/.betelmarket-credentials`

```bash
cat /root/.betelmarket-credentials
```

Panel de BetelMarket:
- admin@betelmarket.com / password123

HestiaCP:
- admin / (la que se generó o la que pusiste con --password)

---

## Estructura en el servidor

```
/opt/betelmarket/              ← Tu aplicación
├── backend/                   ← Laravel API
├── frontend/                  ← Next.js
├── deploy/                    ← Scripts y configs
└── docker-compose.prod.yml

/home/*/web/*/                 ← Sitios de clientes (Hestia)
/etc/nginx/conf.d/             ← Proxy config
/etc/letsencrypt/              ← Certificados SSL
```

---

## Mantenimiento

### Actualizar la app
```bash
cd /opt/betelmarket
git pull
docker compose -f deploy/docker-compose.prod.yml build
docker compose -f deploy/docker-compose.prod.yml up -d
docker exec betelmarket-api php artisan migrate --force
```

### Ver logs
```bash
# Laravel logs
docker logs betelmarket-api -f

# Worker logs
docker logs betelmarket-worker -f

# Nginx logs
tail -f /var/log/nginx/betelmarket-error.log
```

### Reiniciar servicios
```bash
docker compose -f deploy/docker-compose.prod.yml restart
```

### Renovar SSL (automático via cron, pero manual si necesitas)
```bash
certbot renew
```

### Backup manual
```bash
# Database
pg_dump -U betelmarket betelmarket > /root/backup-$(date +%Y%m%d).sql

# Archivos
tar czf /root/betelmarket-files-$(date +%Y%m%d).tar.gz /opt/betelmarket
```

---

## Puertos usados

| Puerto | Servicio |
|--------|----------|
| 22 | SSH |
| 80 | HTTP (redirect a HTTPS) |
| 443 | HTTPS (tu panel + sitios) |
| 8083 | HestiaCP admin panel |
| 25, 587, 465 | SMTP (correo saliente) |
| 110, 995 | POP3 (correo entrante) |
| 143, 993 | IMAP (correo entrante) |
| 53 | DNS |
| 3001-4000 | Apps de clientes (interno) |
| 5432 | PostgreSQL (solo localhost) |
| 6379 | Redis (solo localhost) |
| 8000 | Laravel API (solo localhost) |
| 3000 | Next.js frontend (solo localhost) |

---

## Escalar

Si necesitás más recursos:
1. En Contabo puedes redimensionar el VPS sin perder datos
2. O agregar un segundo servidor y usar el panel para distribuir clientes

---

## Troubleshooting

**Panel no carga**: Verificar que Docker esté corriendo
```bash
docker compose -f deploy/docker-compose.prod.yml ps
```

**Error 502 Bad Gateway**: El backend no responde
```bash
docker logs betelmarket-api --tail 50
```

**Correos van a spam**: Configurar SPF + DKIM + DMARC desde el panel → Security

**SSL no funciona**: Verificar que el DNS apunta a la IP correcta
```bash
dig panel.tudominio.com +short
certbot certificates
```
