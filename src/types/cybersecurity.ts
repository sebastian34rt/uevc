export type AttackType = 
  | 'ddos_flood' 
  | 'sql_injection' 
  | 'xss_injection' 
  | 'brute_force' 
  | 'payload_tampering' 
  | 'path_traversal'
  | 'manual_killswitch';

export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityIncident {
  id?: string;
  type: AttackType;
  title: string;
  description: string;
  threatLevel: ThreatLevel;
  timestamp: number;
  ipOrigin?: string;
  status: 'active_lockdown' | 'mitigated' | 'resolved';
  resolvedBy?: string;
  attackVectorsDetected?: string[];
  requestRate?: number;
  rawPayload?: string;
  targetEndpoint?: string;
}

export interface BlockedIP {
  id?: string;
  ip: string;
  reason: string;
  attackType: AttackType;
  blockedAt: number;
  blockedBy: string;
  status: 'active' | 'lifted';
  userAgent?: string;
  incidentId?: string;
}

export interface WAFMetrics {
  totalInspected: number;
  threatsNeutralized: number;
  activeBans: number;
  lastAttackTime: number | null;
  ratePerMinute: number;
}

export interface WAFInspectionResult {
  isSafe: boolean;
  detectedThreat?: AttackType;
  threatLevel?: ThreatLevel;
  details?: string;
  matchedPattern?: string;
  sanitizedValue?: string;
}

export interface SecurityLockdownState {
  isActive: boolean;
  reason: string;
  attackType: AttackType;
  threatLevel: ThreatLevel;
  initiatedAt: number | null;
  initiatedBy: string;
  autoRecoverAt: number | null;
  lockdownCode?: string;
}

export const ATTACK_TYPE_LABELS: Record<AttackType, { label: string; icon: string; description: string }> = {
  ddos_flood: {
    label: 'Ataque DDoS / Saturación de Peticiones',
    icon: 'Radio',
    description: 'Ráfaga anómala masiva de peticiones diseñada para saturar el servidor y bases de datos.'
  },
  sql_injection: {
    label: 'Intento de Inyección SQL / NoSQL',
    icon: 'Database',
    description: 'Inyección de sentencias estructuradas maliciosas para vulnerar la base de datos.'
  },
  xss_injection: {
    label: 'Inyección de Scripts (XSS Malicioso)',
    icon: 'Code',
    description: 'Intento de ejecución de scripts o etiquetas no autorizadas en formularios y parámetros.'
  },
  brute_force: {
    label: 'Ataque de Fuerza Bruta / Credenciales',
    icon: 'KeyRound',
    description: 'Múltiples intentos reiterados y fallidos de vulneración de claves y accesos.'
  },
  payload_tampering: {
    label: 'Manipulación de Payloads / Cabeceras',
    icon: 'AlertTriangle',
    description: 'Alteración de paquetes HTTP y patrones de tráfico anómalos hacia la API.'
  },
  path_traversal: {
    label: 'Salto de Directorios (Path Traversal / LFI)',
    icon: 'Terminal',
    description: 'Intento de acceso a archivos de sistema restringidos mediante rutas relativas.'
  },
  manual_killswitch: {
    label: 'Cierre de Emergencia Manual (Kill Switch)',
    icon: 'PowerOff',
    description: 'Aislamiento de seguridad activado preventivamente por el Super Administrador.'
  }
};

