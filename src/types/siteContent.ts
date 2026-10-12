export interface SiteContent {
  // Identidad Institucional
  institutionName: string;
  shortName: string;
  institutionBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  experienceYears: string;
  experienceLabel: string;
  experienceSublabel: string;

  // Sobre Nosotros
  aboutPrincipalAuthority: string;
  aboutPrincipalRole: string;
  aboutMission: string;
  aboutVision: string;
  aboutSlogan: string;

  // Oferta Educativa
  programBachillerato: string;
  programSuperior: string;
  programElemental: string;
  programInicial: string;

  // Contacto y Admisiones
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  contactSchedule: string;
  enrollmentFormUrl: string;
  continueFormUrl: string;
  mapsEmbedQuery: string;

  // Plataformas y Redes
  idukayUrl: string;
  billsUrl: string;
  facebookUrl: string;
  instagramUrl: string;

  // Sorteos & Rifas Institucionales
  sorteosHeroBadge?: string;
  sorteosHeroTitle?: string;
  sorteosHeroDescription?: string;
  sorteosSecurityGuarantee?: string;
  sorteosClaimContact?: string;
  sorteosShowHomeBanner?: string;
  sorteosHomeBannerText?: string;
  lockPageForSorteosOnly?: string;

  // Dominio Oficial para Códigos QR y Enlaces Públicos
  publicDomain?: string;
}

export const defaultSiteContent: SiteContent = {
  // Identidad
  institutionName: "Unidad Educativa Virgen del Cisne",
  shortName: "Virgen del Cisne",
  institutionBadge: "Educamos mentes, formamos corazones",
  heroTitle: "Unidad Educativa Virgen del Cisne.",
  heroSubtitle: "Ofrecemos una educación integral de excelencia, fomentando el pensamiento crítico, los valores y la innovación para preparar a nuestros estudiantes para los desafíos del futuro.",
  experienceYears: "+20",
  experienceLabel: "Años de excelencia",
  experienceSublabel: "Formando generaciones",

  // Nosotros
  aboutPrincipalAuthority: "Marjorie Cecibell Floreano Mateo",
  aboutPrincipalRole: "Autoridad Principal",
  aboutMission: "Formamos integralmente a nuestros estudiantes educando mentes y fortaleciendo corazones, en un ambiente inclusivo que inspira conciencia de vida y esperanza en su futuro. Evangelizamos a través de la educación, promoviendo ciudadanos éticos, responsables y solidarios, integrando la fe con la ciencia y la tecnología, al servicio de la transformación social y el apoyo a los más vulnerables.",
  aboutVision: "La institución, regentada por la Diócesis y guiada por el lema “Educar con profesionalismo y calidad humana”, será reconocida como líder y referente de la educación católica, brindando una formación integral con calidad y calidez, integrando tecnología e innovación pedagógica, y formando estudiantes comprometidos con la vida, la justicia, la paz y el bien común.",
  aboutSlogan: "Educar con profesionalismo y calidad humana",

  // Programas
  programBachillerato: "Técnico en Servicios en Informática, los estudiantes se preparan para el mundo tecnológico, laboral y emprendimiento.",
  programSuperior: "En estos niveles de octavo a decimo año, en los cuales buscamos un buen nivel de desarrollo de su inteligencia en área de pensamiento creativo.",
  programElemental: "En estos niveles desde segundo hasta séptimo año de básica, formamos niños y jovenes capaces de resolver problemas en equipo.",
  programInicial: "En este nivel a partir de los cuatro años de edad, los niños fortalecen su identidad y autonomia, a través de un aprendizaje significativo.",

  // Contacto
  contactAddress: "Cantón Salinas, Provincia de Santa Elena, Ecuador",
  contactPhone: "0981179375",
  contactEmail: "contacto@virgendelcisne.edu.ec",
  contactSchedule: "Lunes a Viernes: 8:00 AM - 5:00 PM",
  enrollmentFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdW6WafZnd5eiqe-x9EdGz8ToUfRwepno9UG88p6FSJwh4V_g/viewform",
  continueFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdKUZP4j63Oja6pPAnxLB4CsldcV0D-lJ9Bcc9xvDpkxVytWA/formResponse",
  mapsEmbedQuery: "Unidad Educativa Virgen del Cisne,Salinas,Ecuador",

  // Plataformas
  idukayUrl: "https://idukay.net/",
  billsUrl: "#",
  facebookUrl: "https://www.facebook.com/virgen.cisne.961",
  instagramUrl: "",

  // Sorteos
  sorteosHeroBadge: "Transparencia & Verificación Oficial",
  sorteosHeroTitle: "Sorteos & Rifas Institucionales",
  sorteosHeroDescription: "Portal oficial de verificación digital y transparencia de sorteos de la",
  sorteosSecurityGuarantee: "Cada boleto cuenta con un código único de 9 dígitos y código QR de validación digital para garantizar total legitimidad.",
  sorteosClaimContact: "0981179375",
  sorteosShowHomeBanner: "true",
  sorteosHomeBannerText: "¡Participa en nuestros sorteos benéficos o verifica la autenticidad de tu boleto con su código de 9 dígitos!",
  lockPageForSorteosOnly: "false",

  // Dominio público por defecto para escaneo QR
  publicDomain: "https://uevc.vercel.app",
};
