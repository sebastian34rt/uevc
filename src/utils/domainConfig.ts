/**
 * Utilidad centralizada para resolución de dominio público en códigos QR y enlaces externos.
 * 
 * Garantiza que al escanear los códigos QR con cualquier teléfono celular (iPhone, Android, Google Lens)
 * se ingrese directamente al dominio público en producción (https://uevc.vercel.app o dominio configurado),
 * evitando URLs privadas de desarrollo como localhost:3000 o contenedores internos de AI Studio.
 */

export const DEFAULT_PUBLIC_DOMAIN = 'https://uevc.vercel.app';

/**
 * Limpia y normaliza una URL de dominio
 */
export function cleanDomainUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return DEFAULT_PUBLIC_DOMAIN;
  let cleaned = url.trim();
  if (!cleaned) return DEFAULT_PUBLIC_DOMAIN;

  // Si no tiene protocolo, agregar https://
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }

  // Eliminar diagonales al final
  cleaned = cleaned.replace(/\/+$/, '');

  return cleaned;
}

/**
 * Determina si un origen es de desarrollo interno no accesible desde un teléfono móvil externo
 */
export function isInternalOrDevOrigin(origin: string): boolean {
  if (!origin) return true;
  const lower = origin.toLowerCase();
  return (
    lower.includes('localhost') ||
    lower.includes('127.0.0.1') ||
    lower.includes('0.0.0.0') ||
    lower.includes('ais-dev-') ||
    lower.includes('ais-pre-') ||
    lower.includes('run.app') ||
    lower.includes('googleusercontent.com')
  );
}

/**
 * Obtiene la URL base pública adecuada para generar códigos QR.
 * 
 * Prioridades:
 * 1. customOverride (por ejemplo, valor guardado en Firebase en siteContent.publicDomain).
 * 2. Valor guardado en localStorage ('public_site_domain').
 * 3. Si window.location.origin es un dominio público real (ej. uevc.vercel.app o un .com/.edu.ec propio), se usa.
 * 4. Fallback por defecto: https://uevc.vercel.app
 */
export function getPublicSiteUrl(customOverride?: string | null): string {
  // 1. Override explícito de Firebase
  if (customOverride && typeof customOverride === 'string' && customOverride.trim()) {
    return cleanDomainUrl(customOverride);
  }

  // 2. LocalStorage si el usuario lo configuró localmente
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('public_site_domain');
      if (stored && stored.trim()) {
        return cleanDomainUrl(stored);
      }
    } catch {
      // Ignorar restricciones de almacenamiento
    }

    // 3. Dominio actual si no es entorno de desarrollo privado
    try {
      const currentOrigin = window.location.origin;
      if (currentOrigin && !isInternalOrDevOrigin(currentOrigin)) {
        return cleanDomainUrl(currentOrigin);
      }
    } catch {
      // Ignorar errores de acceso a window.location
    }
  }

  // 4. Fallback por defecto al dominio oficial en Vercel
  return DEFAULT_PUBLIC_DOMAIN;
}

/**
 * Retorna la URL completa para el código QR de verificación de un boleto de sorteo.
 */
export function getSorteoQrUrl(ticketCode: string, domainOverride?: string | null): string {
  const base = getPublicSiteUrl(domainOverride);
  const cleanCode = (ticketCode || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return `${base}/sorteos?ticket=${encodeURIComponent(cleanCode)}`;
}

/**
 * Retorna la URL completa para el código QR de un equipo de HelpDesk / Inventario escolar.
 */
export function getHelpdeskAssetQrUrl(assetCode: string, domainOverride?: string | null): string {
  const base = getPublicSiteUrl(domainOverride);
  const cleanCode = (assetCode || '').trim().toUpperCase();
  return `${base}/helpdesk?asset=${encodeURIComponent(cleanCode)}`;
}

/**
 * Retorna la URL para acceder directamente al dominio de la institución.
 */
export function getPublicPortalQrUrl(path = '', domainOverride?: string | null): string {
  const base = getPublicSiteUrl(domainOverride);
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  return `${base}${cleanPath}`;
}
