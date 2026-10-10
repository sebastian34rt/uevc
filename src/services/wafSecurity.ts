import { AttackType, ThreatLevel, WAFInspectionResult } from '../types/cybersecurity';

// ==========================================
// REGLAS Y PATRONES PERIMETRALES DE INSPECCIÓN WAF
// ==========================================

const SQLI_PATTERNS = [
  /\b(union\s+(all\s+)?select|select\s+[\s\S]+?\s+from|insert\s+into|delete\s+from|drop\s+(table|database)|alter\s+table|exec(\s|\()+|benchmark\s*\(|pg_sleep\s*\(|sleep\s*\()\b/i,
  /('\s*(or|and)\s*['"\d]+=['"\d]+|'\s*(or|and)\s*true\b|admin'\s*--|'\s*or\s*1=1)/i,
  /(\bload_file\b|\binto\s+outfile\b|\bxp_cmdshell\b|information_schema)/i,
  /(\bconcat\s*\(.*0x[0-9a-f]+|\bwaitfor\s+delay\b)/i,
];

const XSS_PATTERNS = [
  /<script\b[^>]*>([\s\S]*?)<\/script>/i,
  /\bon\w+\s*=\s*['"]?[^'"]*['"]?/i, // onload=, onerror=, onclick=
  /javascript:\s*[^"'\s]+/i,
  /<img\s+[^>]*onerror\s*=/i,
  /<svg\s+[^>]*onload\s*=/i,
  /<iframe\b[^>]*>/i,
  /document\.(cookie|location|write)\b/i,
  /<object\b|<embed\b|<applet\b/i,
];

const PATH_TRAVERSAL_PATTERNS = [
  /(\.\.\/|\.\.\\)/,
  /(\/etc\/passwd|\/etc\/shadow|\/proc\/self\/environ)/i,
  /(c:\\windows\\system32|win\.ini|boot\.ini)/i,
];

const COMMAND_INJECTION_PATTERNS = [
  /(;\s*(cat|ls|rm|nc|curl|wget|sh|bash|powershell|cmd\.exe)\s+)/i,
  /(\|\s*(cat|ls|rm|nc|curl|wget|sh|bash|powershell)\s+)/i,
  /(`.*?`|\$\(.*?\))/i,
];

// Almacén de timestamps de peticiones para Rate Limiting (DDoS Detection)
const requestTimestamps: number[] = [];
let cachedClientIp: string | null = null;

export class WAFEngine {
  /**
   * Inspecciona una cadena de texto en busca de vectores de ataque.
   */
  static inspectInput(value: string | unknown, context: string = 'parámetro'): WAFInspectionResult {
    if (typeof value !== 'string' || !value.trim()) {
      return { isSafe: true };
    }

    const trimmed = value.trim();

    // 1. Detección de SQL Injection
    for (const pattern of SQLI_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          isSafe: false,
          detectedThreat: 'sql_injection',
          threatLevel: 'critical',
          details: `Inyección SQL / NoSQL interceptada en "${context}". Patrón coincidente: ${pattern.toString()}`,
          matchedPattern: pattern.toString(),
          sanitizedValue: trimmed.replace(/['";\-\-]/g, '')
        };
      }
    }

    // 2. Detección de Cross-Site Scripting (XSS)
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          isSafe: false,
          detectedThreat: 'xss_injection',
          threatLevel: 'high',
          details: `Vector XSS malicioso bloqueado en "${context}". Intento de ejecución de script o handler DOM.`,
          matchedPattern: pattern.toString(),
          sanitizedValue: trimmed.replace(/<[^>]*>/g, '')
        };
      }
    }

    // 3. Detección de Path Traversal
    for (const pattern of PATH_TRAVERSAL_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          isSafe: false,
          detectedThreat: 'path_traversal',
          threatLevel: 'high',
          details: `Intento de acceso a directorios del sistema (Path Traversal) bloqueado en "${context}".`,
          matchedPattern: pattern.toString(),
          sanitizedValue: trimmed.replace(/\.\./g, '')
        };
      }
    }

    // 4. Detección de Inyección de Comandos
    for (const pattern of COMMAND_INJECTION_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          isSafe: false,
          detectedThreat: 'payload_tampering',
          threatLevel: 'critical',
          details: `Intento de inyección de comandos OS bloqueado en "${context}".`,
          matchedPattern: pattern.toString(),
          sanitizedValue: trimmed.replace(/[;&|`$]/g, '')
        };
      }
    }

    return { isSafe: true };
  }

  /**
   * Inspecciona recursivamente un objeto o formulario completo.
   */
  static inspectPayload(payload: Record<string, any>, context: string = 'formulario'): {
    isSafe: boolean;
    violation?: WAFInspectionResult;
    field?: string;
  } {
    for (const [key, val] of Object.entries(payload)) {
      if (typeof val === 'string') {
        const result = this.inspectInput(val, `${context}.${key}`);
        if (!result.isSafe) {
          return { isSafe: false, violation: result, field: key };
        }
      } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        const subResult = this.inspectPayload(val, `${context}.${key}`);
        if (!subResult.isSafe) {
          return subResult;
        }
      }
    }
    return { isSafe: true };
  }

  /**
   * Monitoriza la tasa de peticiones del cliente (DDoS Flood Detector).
   * Límite: 25 peticiones en un lapso de 6 segundos.
   */
  static checkRateLimit(limit: number = 25, windowMs: number = 6000): { isFlooding: boolean; rate: number } {
    const now = Date.now();
    requestTimestamps.push(now);

    // Filtrar peticiones fuera de la ventana
    const recent = requestTimestamps.filter(t => now - t <= windowMs);
    requestTimestamps.length = 0;
    requestTimestamps.push(...recent);

    const isFlooding = recent.length >= limit;
    return {
      isFlooding,
      rate: recent.length
    };
  }

  /**
   * Obtiene la dirección IP pública y huella digital del visitante.
   */
  static async resolveClientIdentity(): Promise<{ ip: string; fingerprint: string }> {
    if (cachedClientIp) {
      return { ip: cachedClientIp, fingerprint: this.generateBrowserFingerprint() };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch('https://api.ipify.org?format=json', { 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        cachedClientIp = data.ip;
        return { 
          ip: data.ip, 
          fingerprint: this.generateBrowserFingerprint() 
        };
      }
    } catch {
      // Fallback a huella sintética de red si no hay acceso a ipify
    }

    const fallbackIp = `190.152.${Math.floor(10 + Math.random() * 80)}.${Math.floor(2 + Math.random() * 250)}`;
    cachedClientIp = fallbackIp;
    return { 
      ip: fallbackIp, 
      fingerprint: this.generateBrowserFingerprint() 
    };
  }

  /**
   * Genera una huella única del navegador del visitante.
   */
  static generateBrowserFingerprint(): string {
    if (typeof window === 'undefined') return 'SRV-NODE-FPR';
    const nav = window.navigator;
    const raw = `${nav.userAgent}|${nav.language}|${window.screen.width}x${window.screen.height}|${nav.hardwareConcurrency || 4}`;
    
    // Hash djb2 simple
    let hash = 5381;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) + hash) + raw.charCodeAt(i);
    }
    return 'FPR-' + Math.abs(hash).toString(16).toUpperCase();
  }
}
