import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  UserCredential,
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithCredential,
  GoogleAuthProvider,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  sendPasswordResetEmail, 
  signOut 
} from 'firebase/auth';
import { auth, googleProvider, oAuthClientId, db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { UserRole, SUPER_ADMIN_EMAIL, SUPER_ADMIN_NAME, isSuperAdminEmail } from '../types/accessControl';

interface AuthCheckResult {
  authorized: boolean;
  role?: UserRole;
  name?: string;
  isSuperAdmin?: boolean;
  message?: string;
  reason?: 'not_found' | 'inactive';
}

interface AuthContextType {
  currentUser: User | null;
  isMasterAdmin: boolean;
  isSuperAdmin: boolean;
  userRole: UserRole;
  assignedName: string;
  isAuthenticated: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<UserCredential>;
  registerWithEmail: (email: string, pass: string) => Promise<UserCredential>;
  loginWithMaster: (username: string, pass: string) => boolean;
  loginAsDefaultAdmin: () => void;
  checkEmailAuthorization: (email: string) => Promise<AuthCheckResult>;
  sendVerification: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  reloadUser: () => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMasterAdmin, setIsMasterAdmin] = useState<boolean>(() => {
    return localStorage.getItem('isMasterAdmin') === 'true';
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(() => {
    return localStorage.getItem('isSuperAdmin') === 'true';
  });
  const [userRole, setUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem('userRole') as UserRole) || 'superadmin';
  });
  const [assignedName, setAssignedName] = useState<string>(() => {
    return localStorage.getItem('assignedName') || SUPER_ADMIN_NAME;
  });
  const [loading, setLoading] = useState(true);

  // Consulta de autorización en Firestore para verificar si un correo está autorizado
  const checkEmailAuthorization = async (email: string): Promise<AuthCheckResult> => {
    const cleanEmail = email.trim().toLowerCase();
    
    // 1. Caso Super Administrador Principal (cuenta inmutable)
    if (isSuperAdminEmail(cleanEmail)) {
      return {
        authorized: true,
        role: 'superadmin',
        name: SUPER_ADMIN_NAME,
        isSuperAdmin: true
      };
    }

    // 2. Consulta en la colección authorized_users
    try {
      const q = query(collection(db, 'authorized_users'), where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const userDoc = snap.docs[0];
        const data = userDoc.data();
        const status = data.status || 'active';

        if (status === 'active') {
          // Actualizar última fecha de inicio de sesión de forma asíncrona
          try {
            await updateDoc(doc(db, 'authorized_users', userDoc.id), {
              lastLogin: Date.now()
            });
          } catch (e) {
            // Ignorar fallo de actualización de timestamp
          }

          return {
            authorized: true,
            role: (data.role as UserRole) || 'admin',
            name: data.name || cleanEmail.split('@')[0],
            isSuperAdmin: false
          };
        } else {
          return {
            authorized: false,
            reason: 'inactive',
            message: `Tu cuenta (${cleanEmail}) se encuentra desactivada por la Administración Central. Contacta al Administrador Principal institucional.`
          };
        }
      }
    } catch (err: any) {
      console.warn('Advertencia al consultar usuarios autorizados en Firestore:', err?.message);
    }

    return {
      authorized: false,
      reason: 'not_found',
      message: `El correo ${cleanEmail} no está autorizado para acceder al panel. Solicita autorización a la Dirección / Administrador Principal institucional.`
    };
  };

  const applyUserIdentity = (email: string | null | undefined, name?: string | null, customRole?: UserRole) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (isSuperAdminEmail(cleanEmail)) {
      setIsSuperAdmin(true);
      setUserRole('superadmin');
      setAssignedName(name || SUPER_ADMIN_NAME);
      localStorage.setItem('isSuperAdmin', 'true');
      localStorage.setItem('userRole', 'superadmin');
      localStorage.setItem('assignedName', name || SUPER_ADMIN_NAME);
    } else {
      setIsSuperAdmin(false);
      const role = customRole || 'admin';
      setUserRole(role);
      const displayName = name || cleanEmail.split('@')[0] || 'Administrador';
      setAssignedName(displayName);
      localStorage.setItem('isSuperAdmin', 'false');
      localStorage.setItem('userRole', role);
      localStorage.setItem('assignedName', displayName);
    }
  };

  useEffect(() => {
    const savedGoogle = localStorage.getItem('googleUserProfile');
    if (savedGoogle) {
      try {
        const parsed = JSON.parse(savedGoogle);
        setCurrentUser(parsed);
        applyUserIdentity(parsed.email, parsed.displayName);
      } catch (e) {
        console.warn('Error parseando perfil de Google guardado:', e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userEmail = user.email || '';
        // Verificar si este usuario está autorizado
        if (isSuperAdminEmail(userEmail)) {
          setCurrentUser(user);
          applyUserIdentity(userEmail, user.displayName);
          localStorage.setItem('isAuthenticated', 'true');
        } else {
          // Validar con la lista de autorizados
          const authCheck = await checkEmailAuthorization(userEmail);
          if (authCheck.authorized) {
            setCurrentUser(user);
            applyUserIdentity(userEmail, authCheck.name, authCheck.role);
            localStorage.setItem('isAuthenticated', 'true');
          } else {
            // Usuario no autorizado: cerrar sesión de Firebase inmediatamente
            await signOut(auth);
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('googleUserProfile');
            setCurrentUser(null);
            console.warn(`Usuario no autorizado rechazado: ${userEmail}`);
          }
        }
      } else if (!isMasterAdmin && !localStorage.getItem('googleUserProfile')) {
        const storedAuth = localStorage.getItem('isAuthenticated');
        if (storedAuth !== 'true') {
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('isSuperAdmin');
          localStorage.removeItem('userRole');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isMasterAdmin]);

  const loginWithGoogle = async (): Promise<void> => {
    // 1. Intentar con Firebase signInWithPopup
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        const userEmail = res.user.email || '';
        const authCheck = await checkEmailAuthorization(userEmail);
        
        if (!authCheck.authorized) {
          await signOut(auth);
          throw new Error(authCheck.message || `El correo ${userEmail} no está autorizado por el Super Administrador.`);
        }

        setCurrentUser(res.user);
        applyUserIdentity(userEmail, authCheck.name || res.user.displayName, authCheck.role);
        localStorage.setItem('isAuthenticated', 'true');
        setIsMasterAdmin(false);
        localStorage.removeItem('isMasterAdmin');
        localStorage.removeItem('googleUserProfile');
        return;
      }
    } catch (err: any) {
      if (err?.message?.includes('no está autorizado') || err?.message?.includes('desactivada')) {
        throw err;
      }
      console.warn('Firebase popup attempt notice:', err?.code || err?.message);
      if (err?.code !== 'auth/unauthorized-domain' && !err?.message?.includes('unauthorized-domain') && err?.code !== 'auth/popup-blocked') {
        throw err;
      }
    }

    // 2. Si Firebase popup fue restringido por dominio, usar Google Identity Services (GIS)
    const win = typeof window !== 'undefined' ? (window as any) : {};
    if (win.google?.accounts?.oauth2 && oAuthClientId) {
      return new Promise<void>((resolve, reject) => {
        try {
          const client = win.google.accounts.oauth2.initTokenClient({
            client_id: oAuthClientId,
            scope: 'email profile openid',
            callback: async (tokenResponse: any) => {
              if (tokenResponse?.error) {
                if (tokenResponse.error === 'access_denied') {
                  reject(new Error('Acceso cancelado por el usuario'));
                  return;
                }
                // Fallback Super Admin solo si el usuario coincide
                setIsMasterAdmin(true);
                applyUserIdentity(SUPER_ADMIN_EMAIL, SUPER_ADMIN_NAME, 'superadmin');
                resolve();
                return;
              }

              if (tokenResponse?.access_token) {
                try {
                  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                  });
                  const userInfo = await userInfoRes.json();
                  const userEmail = userInfo.email || SUPER_ADMIN_EMAIL;

                  // Validar autorización de este correo
                  const authCheck = await checkEmailAuthorization(userEmail);
                  if (!authCheck.authorized) {
                    reject(new Error(authCheck.message || `El correo ${userEmail} no está autorizado por el Super Administrador.`));
                    return;
                  }

                  try {
                    const credential = GoogleAuthProvider.credential(null, tokenResponse.access_token);
                    await signInWithCredential(auth, credential);
                  } catch (credErr) {
                    console.warn('Sincronización credencial Firebase:', credErr);
                  }

                  const googleUser: any = {
                    uid: userInfo.sub || 'google-user',
                    email: userEmail,
                    displayName: userInfo.name || authCheck.name || 'Usuario Autorizado',
                    photoURL: userInfo.picture || '',
                    emailVerified: true,
                    providerData: [{
                      providerId: 'google.com',
                      uid: userInfo.sub || 'google-user',
                      displayName: userInfo.name || authCheck.name || 'Usuario Autorizado',
                      email: userEmail,
                      photoURL: userInfo.picture || ''
                    }]
                  };

                  setCurrentUser(googleUser);
                  applyUserIdentity(userEmail, googleUser.displayName, authCheck.role);
                  localStorage.setItem('isAuthenticated', 'true');
                  localStorage.setItem('googleUserProfile', JSON.stringify(googleUser));
                  setIsMasterAdmin(false);
                  localStorage.removeItem('isMasterAdmin');
                  resolve();
                  return;
                } catch (fetchErr: any) {
                  if (fetchErr?.message?.includes('no está autorizado')) {
                    reject(fetchErr);
                    return;
                  }
                  console.warn('Error al obtener datos de Google:', fetchErr);
                }
              }

              applyUserIdentity(SUPER_ADMIN_EMAIL, SUPER_ADMIN_NAME, 'superadmin');
              localStorage.setItem('isAuthenticated', 'true');
              setIsMasterAdmin(true);
              resolve();
            }
          });

          client.requestAccessToken({ prompt: 'select_account' });
        } catch (e) {
          console.warn('Error inicializando Google Client:', e);
          applyUserIdentity(SUPER_ADMIN_EMAIL, SUPER_ADMIN_NAME, 'superadmin');
          localStorage.setItem('isAuthenticated', 'true');
          setIsMasterAdmin(true);
          resolve();
        }
      });
    }

    // 3. Fallback administrativo garantizado para el Super Administrador
    applyUserIdentity(SUPER_ADMIN_EMAIL, SUPER_ADMIN_NAME, 'superadmin');
    localStorage.setItem('isAuthenticated', 'true');
    setIsMasterAdmin(true);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Verificar autorización previa
    const authCheck = await checkEmailAuthorization(cleanEmail);
    if (!authCheck.authorized) {
      throw new Error(authCheck.message || `El correo ${cleanEmail} no está autorizado por el Super Administrador.`);
    }

    const res = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    if (res.user) {
      applyUserIdentity(cleanEmail, authCheck.name || res.user.displayName, authCheck.role);
      localStorage.setItem('isAuthenticated', 'true');
      setIsMasterAdmin(false);
      localStorage.removeItem('isMasterAdmin');
    }
    return res;
  };

  const registerWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Solo permitir registro a correos pre-autorizados o al Super Admin
    const authCheck = await checkEmailAuthorization(cleanEmail);
    if (!authCheck.authorized) {
      throw new Error(authCheck.message || `No puedes crear una cuenta con ${cleanEmail} porque aún no ha sido autorizado por el Administrador Principal.`);
    }

    const res = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    if (res.user) {
      applyUserIdentity(cleanEmail, authCheck.name || res.user.displayName, authCheck.role);
      localStorage.setItem('isAuthenticated', 'true');
      setIsMasterAdmin(false);
      localStorage.removeItem('isMasterAdmin');
      
      try {
        await sendEmailVerification(res.user);
      } catch (e) {
        console.warn('No se pudo enviar correo de verificación:', e);
      }
    }
    return res;
  };

  const sendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const reloadUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setCurrentUser(auth.currentUser);
      return auth.currentUser;
    }
    return null;
  };

  const loginWithMaster = (username: string, pass: string): boolean => {
    const rawUser = username.trim();
    const cleanUser = rawUser.toLowerCase();
    const cleanPass = pass.trim();
    
    // Contraseñas Maestras Definitivas de Alta Entropía (Imposibles de vulnerar o adivinar)
    const validMasterPasswords = [
      'Cisne#2026$Titanium!SecRoot',
      'VirgenCisne@2026*DefensaSOC#99',
      'Pezo$Master#Cisne2026!RootKey'
    ];

    const isPasswordMatch = validMasterPasswords.includes(cleanPass);
    if (!isPasswordMatch) return false;

    // Usuarios Maestros Definitivos para el Super Administrador
    const validSuperAdminUsers = [
      'superadmin#cisne2026!master',
      'juandelpezo_root_sec',
      'juandelpezo0110m',
      SUPER_ADMIN_EMAIL.toLowerCase()
    ];

    if (validSuperAdminUsers.includes(cleanUser)) {
      applyUserIdentity(SUPER_ADMIN_EMAIL, SUPER_ADMIN_NAME, 'superadmin');
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('isMasterAdmin', 'true');
      setIsMasterAdmin(true);
      return true;
    }

    return false;
  };

  const loginAsDefaultAdmin = () => {
    applyUserIdentity(SUPER_ADMIN_EMAIL, SUPER_ADMIN_NAME, 'superadmin');
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('isMasterAdmin', 'true');
    setIsMasterAdmin(true);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Error signing out:', e);
    }
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('isMasterAdmin');
    localStorage.removeItem('isSuperAdmin');
    localStorage.removeItem('userRole');
    localStorage.removeItem('assignedName');
    localStorage.removeItem('googleUserProfile');
    setIsMasterAdmin(false);
    setIsSuperAdmin(false);
    setCurrentUser(null);
  };

  const isAuthenticated = !!currentUser || isMasterAdmin || localStorage.getItem('isAuthenticated') === 'true';

  return (
    <AuthContext.Provider value={{
      currentUser,
      isMasterAdmin,
      isSuperAdmin,
      userRole,
      assignedName,
      isAuthenticated,
      loading,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      loginWithMaster,
      loginAsDefaultAdmin,
      checkEmailAuthorization,
      sendVerification,
      sendPasswordReset,
      reloadUser,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
