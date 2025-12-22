import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl: string;
  type?: "website" | "article";
  jsonLd?: object;
}

export function SEOHead({ 
  title, 
  description, 
  canonicalUrl, 
  type = "website",
  jsonLd 
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Basic meta tags
    updateMetaTag("description", description);
    updateMetaTag("robots", "index, follow");

    // Open Graph
    updateMetaTag("og:title", title, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:type", type, true);
    updateMetaTag("og:url", canonicalUrl, true);
    updateMetaTag("og:site_name", "KillaSpy", true);
    updateMetaTag("og:locale", "pt_BR", true);

    // Twitter Card
    updateMetaTag("twitter:card", "summary");
    updateMetaTag("twitter:title", title);
    updateMetaTag("twitter:description", description);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    // JSON-LD structured data
    const jsonLdId = "seo-jsonld";
    let script = document.getElementById(jsonLdId) as HTMLScriptElement;
    if (jsonLd) {
      if (!script) {
        script = document.createElement("script");
        script.id = jsonLdId;
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }

    // Cleanup on unmount
    return () => {
      // Reset title on unmount
      document.title = "KillaSpy - Ad Intelligence Platform";
    };
  }, [title, description, canonicalUrl, type, jsonLd]);

  return null;
}

// Pre-configured JSON-LD schemas
export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "KillaSpy",
  "legalName": "KillaSpy Tecnologia Ltda.",
  "url": "https://killaspy.online",
  "logo": "https://killaspy.online/pwa-icons/icon-512x512.png",
  "description": "Plataforma de inteligência competitiva para análise de anúncios e estratégias de marketing digital",
  "foundingDate": "2025",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "BR"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "suporte@killaspy.online",
    "contactType": "customer service"
  },
  "sameAs": []
};

export function createWebPageJsonLd(
  name: string,
  description: string,
  url: string,
  dateModified: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": name,
    "description": description,
    "url": url,
    "dateModified": dateModified,
    "inLanguage": "pt-BR",
    "isPartOf": {
      "@type": "WebSite",
      "name": "KillaSpy",
      "url": "https://killaspy.online"
    },
    "publisher": organizationJsonLd
  };
}
