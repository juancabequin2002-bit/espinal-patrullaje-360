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
