import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useSiteContent } from '../context/SiteContentContext';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  path?: string;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  jsonLd?: Record<string, any>;
}

export default function SEO({
  title,
  description,
  keywords,
  image,
  path = '',
  type = 'website',
  noindex = false,
  jsonLd,
}: SEOProps) {
  const { i18n } = useTranslation();
  const { content } = useSiteContent();

  const isEn = i18n.language?.startsWith('en');
  const institutionName = content.institutionName || 'Unidad Educativa Virgen del Cisne';
  const shortName = content.shortName || 'Virgen del Cisne';
  const slogan = isEn
    ? 'Educating minds, shaping hearts'
    : (content.aboutSlogan || content.institutionBadge || 'Educamos mentes, formamos corazones');
  
  // Dynamic page title
  const fullTitle = title 
    ? `${title} | ${shortName}` 
    : `${institutionName} | ${slogan}`;

  // Dynamic meta description
  const metaDescription = description || (
    isEn
      ? 'Comprehensive education of excellence, Catholic values, Technical High School in Computer Services, and bilingual support in Salinas, Ecuador.'
      : (content.heroSubtitle || content.aboutMission || 'Formamos integralmente a nuestros estudiantes educando mentes y fortaleciendo corazones, en un ambiente inclusivo. Educación católica de calidad en Salinas, Ecuador.')
  );

  // Origin & URLs
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentPath = path || (typeof window !== 'undefined' ? window.location.pathname : '');
  const canonicalUrl = `${origin}${currentPath}`;
  const shareImage = image ? (image.startsWith('http') ? image : `${origin}${image}`) : `${origin}/logo.png`;

  // Keywords
  const baseKeywords = `${institutionName}, ${shortName}, colegio Salinas, educación integral, bachillerato técnico informática, educación católica, Ecuador, admisiones escolares`;
  const metaKeywords = keywords ? `${keywords}, ${baseKeywords}` : baseKeywords;

  // Schema.org Structured Data
  const defaultSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: institutionName,
    alternateName: shortName,
    slogan: slogan,
    description: metaDescription,
    url: origin,
    logo: `${origin}/logo.png`,
    image: shareImage,
    telephone: content.contactPhone || '+593981179375',
    email: content.contactEmail || 'contacto@virgendelcisne.edu.ec',
    address: {
      '@type': 'PostalAddress',
      streetAddress: content.contactAddress || 'Cantón Salinas',
      addressLocality: 'Salinas',
      addressRegion: 'Santa Elena',
      addressCountry: 'EC',
    },
    openingHours: content.contactSchedule || 'Mo-Fr 08:00-17:00',
  };

  const activeSchema = jsonLd || defaultSchema;

  return (
    <Helmet>
      <html lang={isEn ? 'en' : 'es'} />
      {/* HTML Title & Primary Meta */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={institutionName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={shareImage} />
      <meta property="og:locale" content={isEn ? 'en_US' : 'es_EC'} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={shareImage} />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(activeSchema)}
      </script>
    </Helmet>
  );
}
