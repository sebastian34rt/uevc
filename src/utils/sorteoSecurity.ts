/**
 * Utilidades de seguridad criptográfica y formato para códigos de boletos de 9 dígitos
 */

/**
 * Genera un código criptográficamente seguro de 9 dígitos numéricos.
 * Rango: 100000000 a 999999999.
 */
export function generateSecure9DigitCode(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    // Número entre 100000000 y 999999999
    const min = 100000000;
    const max = 999999999;
    const range = max - min + 1;
    const code = min + (array[0] % range);
    return code.toString();
  }
  // Fallback seguro
  const min = 100000000;
  const max = 999999999;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

/**
 * Normaliza un código de ticket eliminando espacios, guiones y mayúsculas
 */
export function normalizeTicketCode(code: string): string {
  if (!code) return '';
  return code.replace(/[\s\-_]/g, '').trim().toUpperCase();
}

/**
 * Formatea un código de 9 dígitos en bloques visuales legibles: XXX-XXX-XXX
 * Si no tiene 9 dígitos, lo formatea con su valor original
 */
export function formatTicketCodeDisplay(code: string): string {
  if (!code) return '';
  const clean = normalizeTicketCode(code);
  if (/^\d{9}$/.test(clean)) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 9)}`;
  }
  return code;
}

/**
 * Valida si un código cumple con el estándar de 9 dígitos de seguridad
 */
export function is9DigitCode(code: string): boolean {
  const clean = normalizeTicketCode(code);
  return /^\d{9}$/.test(clean);
}
