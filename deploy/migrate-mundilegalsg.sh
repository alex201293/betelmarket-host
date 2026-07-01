#!/bin/bash
# Migración masiva de correos mundilegalsg.com desde Hostinger
# La contraseña es la misma en Hostinger y en el nuevo panel

echo "=== Iniciando migración de 39 cuentas de mundilegalsg.com ==="
echo ""

migrate() {
  local email="$1"
  local pass="$2"
  echo ">>> Migrando: $email"
  imapsync \
    --host1 imap.hostinger.com --port1 993 --ssl1 \
    --user1 "$email" \
    --password1 "$pass" \
    --host2 localhost --port2 993 --ssl2 \
    --user2 "$email" \
    --password2 "$pass" \
    --nolog --nosyncacls --nofoldersizes
  echo "<<< Completado: $email (exit: $?)"
  echo ""
}

migrate "alexislascano@mundilegalsg.com" 'jB&1IobNBh'
migrate "melanypenafiel@mundilegalsg.com" '3*bQ2I!|Zt'
migrate "gerencia@mundilegalsg.com" 'Zb]#m6Xo4$'
migrate "talentohumano@mundilegalsg.com" ';Ie==EfDAN6v'
migrate "contabilidad@mundilegalsg.com" 'x]7J!qa~rxuc'
migrate "emiliojara@mundilegalsg.com" '7cHrq|vI'
migrate "eduardolucas@mundilegalsg.com" 'OZHpEqT>F4r'
migrate "credito@mundilegalsg.com" 'WRU=!Q:z2|f'
migrate "solicitudes@mundilegalsg.com" '9Dhkv5SbF[v'
migrate "caja@mundilegalsg.com" 'eV>4flWvht6'
migrate "denissefarfan@mundilegalsg.com" '9cAy2AY7>jk#'
migrate "patricionarvaez@mundilegalsg.com" 'gE@fN?x|[!4'
migrate "carlahurtado@mundilegalsg.com" '@Wj8kur&Wm'
migrate "notificaciones@mundilegalsg.com" '|23x/XJNQ0h!'
migrate "ricardochavez@mundilegalsg.com" '8vA!$0s3^Mt7'
migrate "byronmorillo@mundilegalsg.com" 'p1PPPwn0~Wig'
migrate "germandiaz@mundilegalsg.com" 'qQXldI>5'
migrate "dianadaquilema@mundilegalsg.com" '@Q0CNEw1Z[iu'
migrate "elianalozano@mundilegalsg.com" '6#Dc]syLXhUr'
migrate "gisselabalseca@mundilegalsg.com" 'mI#1;1R|Kcmb'
migrate "erikacarrillo@mundilegalsg.com" 'ESD7Ir2N&6z'
migrate "mariavasconez@mundilegalsg.com" 'soEBrzYwb9U+'
migrate "tatianamena@mundilegalsg.com" '8/U~fYb07gXk'
migrate "mariamena@mundilegalsg.com" 'E6c4a2ng&'
migrate "misshelcambizaca@mundilegalsg.com" '/7iklUvD#9l'
migrate "joelharo@mundilegalsg.com" '63!Z0TAdVA[b'
migrate "juridicopg@mundilegalsg.com" 'VoQg@+W3Dv#'
migrate "katherineortega@mundilegalsg.com" 'U8ntWP31nq=+'
migrate "pabloguerrero@mundilegalsg.com" '2=cJ|sQE/4R'
migrate "nathalirivera@mundilegalsg.com" 'Tj6+GAhHUzo'
migrate "chicaizachristian@mundilegalsg.com" '[v$;$#Hy0F'
migrate "gavilanezshadia@mundilegalsg.com" 'DDJFNasdqw27@*-'
migrate "vivianagavilanez@mundilegalsg.com" 'r4Xs+Qp:'
migrate "nataliacarranza@mundilegalsg.com" 'Tr=bdI?88^'
migrate "marcolara@mundilegalsg.com" 'IXoaDU$k^6LQ'
migrate "chasiquizacristian@mundilegalsg.com" 'j^6XZen#WLE'
migrate "vasquezsandra@mundilegalsg.com" 'DDJFNasdqw27@*-'
migrate "merchanadrian@mundilegalsg.com" '?s7M|0D:'
migrate "guerraandres@mundilegalsg.com" 'pye$6pmiB|6l'

echo ""
echo "=== MIGRACIÓN COMPLETADA ==="
echo "Todas las 39 cuentas han sido procesadas."
