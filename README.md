# El Espinal · Patrullaje 360°

Mapa interactivo con las nueve zonas de atención y nueve recorridos ilustrativos de UNIPOL, Reacción y GOES.

- Reproducción automática de los iconos, con pausa, velocidad y tamaño ajustables.
- Giro de 360°, botón Norte, zoom y desplazamiento.
- Imágenes satelitales por nivel de detalle y nombres de calles y carreras.
- KML y KMZ incluidos para Google Earth. En Google Earth el recorrido se inicia manualmente.

Los movimientos son una simulación y no representan posiciones en tiempo real ni horarios de servicio.

## Render

El acceso con usuario y contraseña se ejecuta en un Web Service de Node (`npm install --omit=dev`, `npm start`, plan gratuito). `render-auth.yaml` documenta su configuración. El sitio estático anterior se mantiene como enlace de entrada.

Configurar `NODE_ENV=production`, `AUTH_USERNAME` y `AUTH_PASSWORD_HASH` como variables de entorno de Render. El verificador tiene formato `scrypt:<sal hexadecimal de 16 bytes>:<clave hexadecimal de 64 bytes>`, con los parámetros predeterminados de `crypto.scrypt`. Nunca incluir contraseñas en el HTML ni en el repositorio. Los archivos `.env` se excluyen de Git.

`server.mjs` valida las credenciales, limita los intentos y emite cookies de sesión HttpOnly/Secure/SameSite. Las sesiones duran ocho horas y se revocan al cerrar sesión; reiniciar el servicio también cierra las sesiones. El mapa y las descargas del servicio Node requieren sesión. `/healthz` es público para el control de disponibilidad.

El código y la cartografía ya publicados en este repositorio público y en su historial siguen disponibles en GitHub; el inicio de sesión controla el acceso a la aplicación alojada.

## Uso local

Para probar la autenticación, configurar un `.env` privado y ejecutar `node --env-file=.env server.mjs`. `npm test` comprueba acceso anónimo, contraseñas incorrectas, CSRF, descargas protegidas y cierre de sesión. La cartografía editable está en `protected/index.html`; mantener esa copia como fuente de futuras actualizaciones del mapa.

Las imágenes satelitales necesitan internet. El mapa conserva la imagen de respaldo cuando no hay conexión.

## Fuentes

Jurisdicciones y recorridos: KML aportado por el usuario. Logos: archivos aportados por el usuario. Imágenes satelitales: Esri, Maxar, Earthstar Geographics y proveedores atribuidos en el visor. Calles: © OpenStreetMap contributors, https://www.openstreetmap.org/copyright.

## Enlaces

- Mapa: https://juancabequin2002-bit.github.io/espinal-patrullaje-360/
- Publicar en Render: https://render.com/deploy?repo=https://github.com/juancabequin2002-bit/espinal-patrullaje-360

## Capas de jurisdicción

Se muestran las 27 veredas del archivo cartográfico aportado y los tres polígonos Centro, Entrerríos y Saucedal de la carpeta MICRO TERRITORIO ESPINAL del KML. Se conservan las nueve zonas y los nueve recorridos anteriores.

Los límites rurales proceden de `veredas_igac.geojson`, cuyos atributos identifican PBOT Espinal y vigencia 2010. No se presenta esta capa como una nueva certificación oficial de límites. Las geometrías de los microterritorios se conservan del KML aportado. Chicoral se muestra como nombre de referencia del centro poblado.
