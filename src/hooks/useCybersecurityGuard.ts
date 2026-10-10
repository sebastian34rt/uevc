import { useEffect, useRef } from 'react';
import { useCybersecurity } from '../context/CybersecurityContext';

export function useCybersecurityGuard() {
  const { reportClientAnomaly, lockdownState } = useCybersecurity();
  const requestHistory = useRef<number[]>([]);
  const isTriggered = useRef(false);

  useEffect(() => {
    if (lockdownState.isActive) return;

    // 1. Detección de patrones maliciosos en URL (SQLi, XSS, Path Traversal)
    const currentSearch = window.location.search || '';
    const currentHash = window.location.hash || '';
    const fullQuery = decodeURIComponent(currentSearch + currentHash).toLowerCase();

    const maliciousPatterns = [
      /<script[\s\S]*?>/i,
      /javascript:/i,
      /union\s+select/i,
      /drop\s+table/i,
      /or\s+1\s*=\s*1/i,
      /exec\s*\(/i,
      /\.\.\/\.\.\//i,
      /<iframe/i,
      /onload\s*=/i,
      /onerror\s*=/i
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(fullQuery)) {
        if (!isTriggered.current) {
          isTriggered.current = true;
          reportClientAnomaly(
            'xss_injection', 
            `Detección perimetral de inyección de código malicioso en URL: "${fullQuery.slice(0, 50)}..."`,
            'high'
          );
        }
        break;
      }
    }

    // 2. Detección de ráfagas anómalas de peticiones / Flood DDoS
    const handleActionFlood = () => {
      const now = Date.now();
      requestHistory.current.push(now);

      // Conservar solo los últimos 2 segundos
      requestHistory.current = requestHistory.current.filter(t => now - t < 2000);

      if (requestHistory.current.length > 30) { // Más de 30 eventos en 2s
        if (!isTriggered.current) {
          isTriggered.current = true;
          reportClientAnomaly(
            'ddos_flood',
            `DDoS Anomaly: Ráfaga extrema de ${requestHistory.current.length} peticiones por segundo detectada desde el cliente.`,
            'critical'
          );
        }
      }
    };

    window.addEventListener('click', handleActionFlood);
    window.addEventListener('keydown', handleActionFlood);

    return () => {
      window.removeEventListener('click', handleActionFlood);
      window.removeEventListener('keydown', handleActionFlood);
    };
  }, [lockdownState.isActive, reportClientAnomaly]);
}
