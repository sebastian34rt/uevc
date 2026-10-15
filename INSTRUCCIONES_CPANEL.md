# Guía Oficial de Subida y Despliegue a cPanel (public_html)
### Unidad Educativa Virgen del Cisne

---

## Opción A: Subida Rápida con Administrador de Archivos (Recomendada - 2 minutos)

Ya hemos generado el archivo comprimido listo para producción: **`cpanel_public_html.zip`** (3.5 MB).

### Pasos:
1. Inicia sesión en tu cuenta de **cPanel**.
2. Abre la herramienta **"Administrador de archivos"** (*File Manager*).
3. En el árbol de carpetas a la izquierda, entra a la carpeta **`public_html`** (o la carpeta raíz de tu dominio principal/subdominio).
4. Haz clic en el botón superior **"Cargar"** (*Upload*).
5. Selecciona y sube el archivo **`cpanel_public_html.zip`** (o arrástralo).
6. Una vez completada la barra al 100% en verde, vuelve a `public_html`.
7. Haz clic derecho sobre `cpanel_public_html.zip` y selecciona **"Extraer"** (*Extract*).
8. Confirma la ruta de extracción en `/public_html`.
9. ¡Listo! Puedes eliminar el archivo `.zip` después de extraerlo.

> **Importante sobre archivos ocultos en cPanel:**  
> Asegúrate de que la opción **"Mostrar archivos ocultos (dotfiles)"** esté activada en la configuración del Administrador de Archivos (icono de engranaje ⚙️ arriba a la derecha) para comprobar que el archivo `.htaccess` esté presente en la raíz de `public_html`.

---

## Opción B: Despliegue Automático mediante cPanel Git™ Version Control

Si utilizas la herramienta **"Git™ Version Control"** de cPanel vinculada a este repositorio:

El archivo **`.cpanel.yml`** ya está configurado en la raíz del proyecto:
```yaml
---
deployment:
  tasks:
    - export DEPLOYPATH=/home/uevcedue/public_html
    - /bin/cp -R dist/* $DEPLOYPATH/
    - /bin/cp -f dist/.htaccess $DEPLOYPATH/
```

Simplemente haz clic en **"Deploy HEAD Commit"** desde cPanel y se copiará automáticamente la carpeta `dist/` a `public_html`.

---

## ¿Qué incluye la carpeta `dist/` y el archivo `cpanel_public_html.zip`?

1. **`index.html`**: Punto de entrada con metaetiquetas SEO institucionales.
2. **`.htaccess` de alto rendimiento**:
   - Redirección automática de `http://` a `https://`.
   - Soporte para **React Router SPA** (permite recargar páginas como `/sorteos`, `/admin`, `/login` sin errores 404).
   - Tipos MIME correctos para PWA (`.webmanifest`, `.woff2`, `.svg`, `.json`).
   - Control de caché inteligente (`index.html` sin caché para actualizaciones inmediatas; `assets/` con hash por 1 año).
   - Compresión GZIP activa para máxima velocidad.
   - Encabezados de seguridad (`X-Frame-Options`, `X-Content-Type-Options`).
3. **`assets/`**: Todos los scripts de React, estilos CSS y librerías compilados y minificados.
4. **Imágenes y Recursos Multimedia**: Logotipo institucional, favicon, iconos PWA e imágenes de galería.
5. **PWA (Progressive Web App)**: `manifest.webmanifest`, `sw.js` y `workbox` para funcionamiento sin conexión.
6. **Integración Firebase en la nube**: Conectado directamente a tu base de datos Firestore oficial en la nube.
