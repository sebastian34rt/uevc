# 🏫 Unidad Educativa Virgen del Cisne - Portal Web y Sistema de Gestión

Plataforma web institucional moderna, segura y autogestionable de la **Unidad Educativa Virgen del Cisne**. Desarrollada con React 19, TypeScript, Tailwind CSS, Vite y conectada en tiempo real con Firebase Firestore & Authentication.

---

## 🚀 Guía Rápida: Cómo hacer `push` a GitHub

Si deseas subir este proyecto a tu cuenta de GitHub, sigue estos sencillos pasos:

### 1. Crear un repositorio en GitHub
1. Entra a [github.com/new](https://github.com/new).
2. Asigna un nombre al repositorio (por ejemplo: `virgen-del-cisne-web`).
3. **No marques** "Add a README file" ni "Add .gitignore" (el proyecto ya los incluye configurados).
4. Haz clic en **Create repository**.
5. Copia la URL de tu repositorio (por ejemplo: `https://github.com/tu-usuario/virgen-del-cisne-web.git`).

### 2. Conectar y subir el proyecto desde la terminal

Abre la terminal en la carpeta del proyecto y ejecuta los siguientes comandos:

```bash
# 1. Verificar el estado de los archivos
git status

# 2. Agregar todos los archivos al seguimiento
git add .

# 3. Crear el commit inicial
git commit -m "feat: Portal web institucional completo con sorteos y panel admin"

# 4. Asegurarse de estar en la rama principal 'main'
git branch -M main

# 5. Vincular tu repositorio de GitHub (reemplaza con tu URL real)
git remote add origin https://github.com/tu-usuario/virgen-del-cisne-web.git

# 6. Subir todo el código a GitHub
git push -u origin main
```

> 💡 **Nota de Autenticación:** Si GitHub te pide contraseña al hacer `git push`, recuerda que GitHub requiere un **Personal Access Token (PAT)** o tus credenciales SSH. Puedes generar un token en [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens).

### 3. Para subir actualizaciones futuras

Cada vez que realices cambios en el código y quieras enviarlos a GitHub:

```bash
git add .
git commit -m "Descripción de los cambios realizados"
git push
```

---

## 🛠️ Tecnologías y Herramientas

- **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** [Vite 6](https://vitejs.dev/)
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animaciones:** [Motion (Framer Motion)](https://motion.dev/)
- **Iconografía:** [Lucide React](https://lucide.dev/)
- **Base de Datos & Auth:** [Firebase Firestore & Firebase Auth](https://firebase.google.com/)
- **Enrutamiento:** [React Router v7](https://reactrouter.com/)
- **PWA & Offline:** [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- **CI/CD:** [GitHub Actions](.github/workflows/)

---

## 💻 Instalación y Desarrollo Local

### Requisitos previos
- Node.js 18 o superior instalado en tu computadora.
- Gestor de paquetes `npm`.

### Pasos:
1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/virgen-del-cisne-web.git
   cd virgen-del-cisne-web
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar el servidor local de desarrollo:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

4. Compilar para producción:
   ```bash
   npm run build
   ```
   Los archivos listos para producción se generarán en la carpeta `dist/`.

---

## 📂 Estructura del Proyecto

```text
├── public/
│   ├── .htaccess             # Reglas Apache/cPanel para React Router SPA
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/           # Componentes UI (Hero, Sorteos, Galería, etc.)
│   │   ├── AdminDashboard.tsx       # Panel administrativo central
│   │   ├── AdminPageEditor.tsx      # Editor en vivo de contenidos del sitio
│   │   ├── AdminSorteoManager.tsx   # Gestor de rifas, boletos y ruleta
│   │   ├── SorteosPublicPage.tsx    # Portal público de verificación de boletos
│   │   └── ...
│   ├── context/              # Estados globales (Auth, Sorteos, SiteContent, etc.)
│   ├── firebase.ts           # Inicialización de Firebase SDK y Firestore
│   ├── App.tsx               # Enrutamiento principal
│   └── main.tsx              # Punto de entrada de la aplicación
├── .cpanel.yml               # Configuración de despliegue directo con Git en cPanel
├── .gitignore                # Archivos excluidos del repositorio
├── firebase-applet-config.json # Configuración de conexión Firebase
└── package.json
```

---

## 🌐 Despliegue en cPanel

El proyecto ya incluye soporte completo para servidores cPanel / Apache:
- **Archivo `.htaccess`:** Ubicado en `public/.htaccess`, garantiza que rutas como `/sorteos`, `/admin` o `/login` no den error 404 al recargar la página.
- **Archivo `.cpanel.yml`:** Permite despliegue automatizado desde la herramienta *cPanel Git Version Control*.

---

## 🔒 Seguridad y Privacidad

- **Sorteos & Rifas:** Códigos alfanuméricos únicos y privados de 9 dígitos. Verificación de boletos sin exponer listas completas de compradores ni teléfonos para prevenir fraudes.
- **Acceso Administrativo:** Restringido por roles validados en Firebase Firestore y autenticación Google / Password.
