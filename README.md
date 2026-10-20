# El Espinal · Patrullaje 360°

Mapa interactivo con las nueve zonas de atención y nueve recorridos ilustrativos de UNIPOL, Reacción y GOES.

- Reproducción automática de los iconos, con pausa, velocidad y tamaño ajustables.
- Giro de 360°, botón Norte, zoom y desplazamiento.
- Imágenes satelitales por nivel de detalle y nombres de calles y carreras.
- KML y KMZ incluidos para Google Earth. En Google Earth el recorrido se inicia manualmente.

Los movimientos son una simulación y no representan posiciones en tiempo real ni horarios de servicio.

## Render

Crear un Static Site desde este repositorio. Build command: `echo "Static site ready"`. Publish directory: `public`. También se incluye `render.yaml` para despliegue con Blueprint.

## Uso local

Abrir `public/index.html`. Las imágenes satelitales necesitan internet. El mapa conserva la imagen de respaldo cuando no hay conexión.

## Fuentes

Jurisdicciones y recorridos: KML aportado por el usuario. Logos: archivos aportados por el usuario. Imágenes satelitales: Esri, Maxar, Earthstar Geographics y proveedores atribuidos en el visor. Calles: © OpenStreetMap contributors, https://www.openstreetmap.org/copyright.

## Enlaces

- Mapa: https://juancabequin2002-bit.github.io/espinal-patrullaje-360/
- Publicar en Render: https://render.com/deploy?repo=https://github.com/juancabequin2002-bit/espinal-patrullaje-360

## Capas de jurisdicción

Se muestran las 27 veredas del archivo cartográfico aportado y los tres polígonos Centro, Entrerríos y Saucedal de la carpeta MICRO TERRITORIO ESPINAL del KML. Se conservan las nueve zonas y los nueve recorridos anteriores.

Los límites rurales proceden de `veredas_igac.geojson`, cuyos atributos identifican PBOT Espinal y vigencia 2010. No se presenta esta capa como una nueva certificación oficial de límites. Las geometrías de los microterritorios se conservan del KML aportado. Chicoral se muestra como nombre de referencia del centro poblado.
