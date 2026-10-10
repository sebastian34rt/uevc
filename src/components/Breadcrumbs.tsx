import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

export default function Breadcrumbs() {
  const { t } = useTranslation();
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const routeNames: Record<string, string> = {
    '': t('breadcrumbs.home'),
    'galeria': t('breadcrumbs.gallery'),
    'inscripcion': t('breadcrumbs.admissions'),
    'privacidad': t('breadcrumbs.privacy'),
    'terminos': t('breadcrumbs.terms'),
    'sorteos': t('breadcrumbs.sorteos'),
    'directorio': t('breadcrumbs.directory'),
    'helpdesk': t('breadcrumbs.helpdesk'),
    'en-vivo': t('breadcrumbs.live'),
  };

  // Ocultar en la ruta principal y login/admin
  if (pathnames.length === 0 || pathnames[0] === 'admin' || pathnames[0] === 'login') {
    return null;
  }

  return (
    <div className="w-full pt-28 pb-4 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto flex items-center text-sm">
      <motion.nav 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        aria-label="Breadcrumb"
      >
        <ol className="flex items-center space-x-2">
          <li>
            <Link to="/" className="text-texto/50 hover:text-primario transition-colors flex items-center">
              <Home className="w-4 h-4" />
              <span className="sr-only">{t('breadcrumbs.home')}</span>
            </Link>
          </li>
          {pathnames.map((value, index) => {
            const last = index === pathnames.length - 1;
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;
            const name = routeNames[value] || value;

            return (
              <li key={to} className="flex items-center space-x-2">
                <ChevronRight className="w-4 h-4 text-texto/30" />
                {last ? (
                  <span className="text-texto font-medium" aria-current="page">
                    {name}
                  </span>
                ) : (
                  <Link to={to} className="text-texto/50 hover:text-primario transition-colors">
                    {name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </motion.nav>
    </div>
  );
}
