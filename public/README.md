# Guía de Archivos de la Institución

Esta carpeta (`/public/`) está destinada a almacenar los archivos públicos de la página web, incluyendo las imágenes (tanto en formato `.jpg` como `.png`). A continuación, te explicamos qué imágenes se usan en cada sección de la página y cómo puedes organizarlas.

## 1. Logo de la Institución
- **Uso:** Aparece en la barra de navegación superior (Header) y en el pie de página (Footer).
- **Nombre recomendado:** `logo.png`, `logo.jpg` o `logo.svg`.
- **Cómo usarlo:** Sube el logo aquí y asegúrate de referenciarlo en el código como `/logo.png` o `/logo.jpg`.

## 2. Sección Principal (Hero / Portada)
- **Uso:** Es la imagen grande que aparece apenas abres la página (la portada principal).
- **Nombre actual en el código:** `/1.jpg`.
- **Recomendación:** Usa una foto apaisada (horizontal) de alta calidad del campus, estudiantes o la fachada de la institución. Puede ser `.jpg` o `.png`.

## 3. Sección de Noticias
- **Uso:** Imágenes que acompañan a cada noticia o comunicado.
- **Nombres actuales en el código:** `/2.jpg`, `/3.jpg`, `/4.jpg`.
- **Recomendación:** Puedes subir imágenes como `noticia1.jpg`, `noticia2.png` y luego usar esa ruta (ej. `/noticia1.jpg`) cuando crees una nueva noticia en el **Panel de Control**.

## 4. Galería de Imágenes
- **Uso:** Fotos que muestran las instalaciones, eventos, laboratorios y vida estudiantil.
- **Nombres actuales en el código:** `/1.jpg` a `/8.jpg`.
- **Recomendación:** Cuando subas nuevas fotos para la galería desde el **Panel de Control**, puedes agregarlas a esta carpeta con nombres como `galeria-1.jpg`, `galeria-2.png`, etc., y usar su ruta `/galeria-1.jpg`.

## 5. Favicon (Icono de pestaña del navegador)
- **Uso:** El pequeño ícono que aparece en la pestaña del navegador.
- **Ubicación:** Va en esta misma carpeta `/public/` con el nombre `favicon.ico` o `favicon.svg`.

---

**¿Cómo referenciar estas imágenes en el código o panel?**
- Si la imagen se llama `mi-foto.jpg` o `mi-foto.png` y está dentro de la carpeta `/public/`, en el panel de control o en el código web debes escribir exactamente esta ruta: **`/mi-foto.jpg`** o **`/mi-foto.png`**.

