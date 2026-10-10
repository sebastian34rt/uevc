export type UserRole = 'superadmin' | 'admin' | 'editor' | 'helpdesk';

export interface AuthorizedUser {
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'active' | 'inactive';
  assignedBy: string;
  createdAt: number;
  lastLogin?: number;
}

export const SUPER_ADMIN_EMAIL = 'juandelpezo0110m@gmail.com';
export const SUPER_ADMIN_NAME = 'Juan del Pezo';

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
};

export const ROLE_DEFINITIONS: Record<UserRole, {
  label: string;
  description: string;
  badgeColor: string;
  permissions: string[];
}> = {
  superadmin: {
    label: 'Super Administrador',
    description: 'Control total de la institución, gestión de accesos y configuración global.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    permissions: ['all', 'access_control', 'site_content', 'news', 'gallery', 'calendar', 'staff', 'helpdesk']
  },
  admin: {
    label: 'Administrador General',
    description: 'Gestión de contenidos, noticias, eventos, galería, personal y soporte HelpDesk.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    permissions: ['site_content', 'news', 'gallery', 'calendar', 'staff', 'helpdesk']
  },
  editor: {
    label: 'Editor de Contenidos',
    description: 'Gestión de noticias, avisos escolares, agenda y álbumes de galería.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    permissions: ['news', 'gallery', 'calendar']
  },
  helpdesk: {
    label: 'Técnico de Laboratorios & HelpDesk',
    description: 'Gestión de inventario físico QR, tickets de soporte y equipos de laboratorio.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    permissions: ['helpdesk']
  }
};
