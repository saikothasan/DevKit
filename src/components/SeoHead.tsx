import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface FAQ {
  question: string;
  answer: string;
}

interface SeoHeadProps {
  title: string;
  description: string;
  keywords?: string;
  isTool?: boolean;
  image?: string;
  faqData?: FAQ[];
}

export function SeoHead({ title, description, keywords, isTool = false, image = '/logo.svg', faqData }: SeoHeadProps) {
  const location = useLocation();
  const baseUrl = 'https://visatk.us';
  const currentUrl = `${baseUrl}${location.pathname}`;
  const siteName = 'DevKit Pro';
  const fullTitle = isTool ? `${title} | ${siteName} Tools` : `${title} | ${siteName}`;

  useEffect(() => {
    document.title = fullTitle;
    const addedElements: Element[] = [];
    
    const setMetaTag = (selector: string, attribute: string, value: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (selector.includes('name=')) {
          element.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
        } else if (selector.includes('property=')) {
          element.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
        }
        document.head.appendChild(element);
        addedElements.push(element);
      }
      element.setAttribute(attribute, value);
    };

    // Deep SEO Meta
    setMetaTag('meta[name="description"]', 'content', description);
    if (keywords) setMetaTag('meta[name="keywords"]', 'content', keywords);
    setMetaTag('meta[name="robots"]', 'content', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    
    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
      addedElements.push(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // OpenGraph / Social Graphing
    setMetaTag('meta[property="og:type"]', 'content', isTool ? 'product' : 'website');
    setMetaTag('meta[property="og:url"]', 'content', currentUrl);
    setMetaTag('meta[property="og:title"]', 'content', fullTitle);
    setMetaTag('meta[property="og:description"]', 'content', description);
    setMetaTag('meta[property="og:image"]', 'content', `${baseUrl}${image}`);
    setMetaTag('meta[property="og:site_name"]', 'content', siteName);

    // Twitter Card
    setMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'content', fullTitle);
    setMetaTag('meta[name="twitter:description"]', 'content', description);
    setMetaTag('meta[name="twitter:image"]', 'content', `${baseUrl}${image}`);

    // JSON-LD Structured Data for Google Rich Snippets
    let structuredData = document.querySelector('#json-ld');
    if (!structuredData) {
      structuredData = document.createElement('script');
      structuredData.setAttribute('id', 'json-ld');
      structuredData.setAttribute('type', 'application/ld+json');
      document.head.appendChild(structuredData);
    }
    
    const schemas: any[] = [];

    // Application Schema
    schemas.push(isTool ? {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": fullTitle,
      "description": description,
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "All",
      "url": currentUrl,
      "offers": { "@type": "Offer", "price": "0.00", "priceCurrency": "USD" },
      "publisher": { "@type": "Organization", "name": siteName, "url": baseUrl }
    } : {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": siteName,
      "url": baseUrl,
      "description": description
    });

    // FAQ Schema
    if (faqData && faqData.length > 0) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqData.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      });
    }
    
    structuredData.textContent = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);

    // Cleanup phase: Prevents DOM bloat and duplicate SEO tags upon SPA navigation
    return () => {
      addedElements.forEach(el => {
        if (document.head.contains(el)) {
          document.head.removeChild(el);
        }
      });
      const schemaElement = document.querySelector('#json-ld');
      if (schemaElement && document.head.contains(schemaElement)) {
          document.head.removeChild(schemaElement);
      }
    };

  }, [fullTitle, description, keywords, currentUrl, isTool, image, baseUrl, faqData]);

  return null;
}
