# Subir la web a presupuesto.aresolutions.es

**Con «s»: `aresolutions.es`.** `aresolution.es` no existe —no tiene servidores
de nombres— y no es un detalle ortográfico: el dominio tiene que ser el mismo que
el de la API o la sesión deja de funcionar (ver «Por qué la "s" importa»).

## Cómo está hoy (comprobado el 2026-09-07)

| Nombre | Resuelve a | Qué hay |
|---|---|---|
| `api.presupuesto.aresolutions.es` | `31.70.138.212` | el VPS con la API, HTTPS correcto |
| `presupuesto.aresolutions.es` | `2001:8d8:100f:f000::200` | hosting compartido de IONOS, Apache, **página de aparcamiento** y **sin HTTPS** |

El subdominio del frontend existe, pero apunta al hosting compartido, no al VPS.
`https://` no responde: no hay certificado que lo cubra.

## Compilar

```bash
npm run build          # usa environment.prod.ts
```

Sale en `dist/presupuesto_familiar/browser/`. Lo que se sube es **el contenido de
esa carpeta**, no la carpeta. Pesa 3,2 MB en disco; por la red, 659 KB con gzip.

Antes de subir, comprueba que no se ha colado nada que no deba ser público:

```bash
ls dist/presupuesto_familiar/browser/*.{xls,xlsx,csv,txt} 2>/dev/null && echo "OJO"
```

## Opción A — en el VPS con nginx (recomendada)

Frontend y API en la misma máquina y el mismo dominio: un solo sitio que
administrar, HTTPS en un comando y la cookie de sesión sin sorpresas.

**1. DNS en IONOS.** Cambia los registros de `presupuesto.aresolutions.es` para
que apunten al VPS, y borra la AAAA que lo lleva al hosting compartido:

```
A     presupuesto   31.70.138.212
(borrar el registro AAAA que apunta a 2001:8d8:100f:f000::200)
```

Espera a que propague:

```bash
nslookup presupuesto.aresolutions.es 1.1.1.1     # debe devolver 31.70.138.212
```

**2. Subir el build al VPS:**

```bash
ssh TU_USUARIO@31.70.138.212 'sudo mkdir -p /var/www/presupuesto && sudo chown -R $USER /var/www/presupuesto'
rsync -avz --delete dist/presupuesto_familiar/browser/ TU_USUARIO@31.70.138.212:/var/www/presupuesto/
```

`--delete` borra en el servidor lo que ya no está en el build: sin él se
acumulan los bundles antiguos de cada despliegue, y con `outputHashing` son
todos ficheros distintos.

**3. Configurar nginx** con el fichero que va en este repo:

```bash
scp deploy/nginx-presupuesto.conf TU_USUARIO@31.70.138.212:/tmp/
ssh TU_USUARIO@31.70.138.212
sudo mv /tmp/nginx-presupuesto.conf /etc/nginx/sites-available/presupuesto
sudo ln -s /etc/nginx/sites-available/presupuesto /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**4. HTTPS**, que no es opcional:

```bash
sudo certbot --nginx -d presupuesto.aresolutions.es
```

Certbot añade el bloque de escucha en 443, el certificado y la redirección desde
HTTP. Renueva solo.

**5. Comprobar** las tres cosas que se rompen de verdad:

```bash
curl -I https://presupuesto.aresolutions.es/                 # 200
curl -I https://presupuesto.aresolutions.es/presupuesto      # 200, NO 404  <- el fallback del router
curl -s https://presupuesto.aresolutions.es/ | grep -o 'lang="es"'
```

Y en el navegador: entra, inicia sesión, **recarga la página con F5** y
comprueba que la sesión sigue viva. Eso es lo que valida que la cookie del
refresh viaja bien entre los dos subdominios.

## Opción B — en el hosting de IONOS que ya sirve el subdominio

Sin tocar el DNS. A cambio, dos sitios que administrar y dependes del panel.

1. En el panel de IONOS, activa **SSL para el subdominio** y espera la emisión.
2. Sube por SFTP **el contenido** de `dist/presupuesto_familiar/browser/` a la
   carpeta del subdominio, reemplazando la página de aparcamiento.
3. Sube `deploy/htaccess-ionos` a esa misma carpeta **renombrado a `.htaccess`**.
   Sin él, recargar en `/presupuesto` da 404.
4. Cuando el certificado esté emitido, descomenta el bloque de redirección a
   HTTPS del `.htaccess`.

## Por qué la «s» importa

La sesión es un access token en memoria más un **refresh token en cookie
httpOnly** que pone la API. Con el frontend en `presupuesto.aresolutions.es` y la
API en `api.presupuesto.aresolutions.es`, la llamada es de distinto origen pero
del **mismo sitio**: `SameSite` se calcula sobre el dominio registrable,
`aresolutions.es`, que comparten. La cookie se envía con `SameSite=Lax` sin
tocar nada.

Si el frontend viviera en `aresolution.es`, o en `gastosdb-2f9d2.web.app`, serían
sitios distintos: la cookie pasaría a ser de terceros y **al recargar la página
se perdería la sesión** en los navegadores que ya las bloquean. Además, el VPS
tiene lista blanca de CORS y sólo admite `https://presupuesto.aresolutions.es` y
`http://localhost:4200`: cualquier otro origen recibe las peticiones bloqueadas
por el navegador.

## Despliegues siguientes

```bash
npm run build && rsync -avz --delete dist/presupuesto_familiar/browser/ TU_USUARIO@31.70.138.212:/var/www/presupuesto/
```

No hace falta recargar nginx: sirve ficheros del disco. `index.html` va con
`no-store`, así que el navegador se entera del nuevo despliegue en la siguiente
visita.
