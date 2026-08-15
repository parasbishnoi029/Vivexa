import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogType?: "website" | "article" | "product";
  ogImage?: string;
  structuredData?: Record<string, any> | Record<string, any>[];
  noIndex?: boolean;
}

const DEFAULT_TITLE = "Vivexa | Enterprise AI Analytics & Decision Intelligence Platform";
const DEFAULT_DESCRIPTION = "Vivexa is the enterprise-grade AI decision intelligence and analytics operating system. Query multi-source datasets in natural language, run autonomous causal analyses, forecast trends, and generate audited executive briefs with zero hallucinations.";
const DEFAULT_KEYWORDS = [
  "AI Decision Intelligence",
  "Autonomous Data Science",
  "Enterprise Analytics Platform",
  "AI Business Intelligence",
  "Natural Language SQL",
  "Predictive Time-Series Forecasting",
  "Lakehouse Analytics",
  "Databricks Looker Alternative",
  "Zero Hallucination AI",
  "Enterprise BI Operating System",
  "IIT Jodhpur AI Startup",
  "Paras Bishnoi",
  "Karunya Sharma"
];
const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://vivexa.ai";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-preview.png`;

export function SEOHead({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonicalUrl,
  ogType = "website",
  ogImage = DEFAULT_OG_IMAGE,
  structuredData,
  noIndex = false
}: SEOProps) {
  const location = useLocation();
  const fullCanonical = canonicalUrl || `${BASE_URL}${location.pathname}`;
  const formattedTitle = title.includes("Vivexa") ? title : `${title} | Vivexa Enterprise AI`;

  const defaultSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Vivexa",
      "alternateName": "Vivexa Enterprise Decision Intelligence",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Cloud / Web / On-Premise",
      "description": description,
      "url": BASE_URL,
      "author": {
        "@type": "Organization",
        "name": "Vivexa AI",
        "founders": [
          {
            "@type": "Person",
            "name": "Paras",
            "jobTitle": "Founder & CEO",
            "alumniOf": "Indian Institute of Technology Jodhpur"
          },
          {
            "@type": "Person",
            "name": "Karunya Sharma",
            "jobTitle": "Co-Founder & CTO",
            "alumniOf": "Indian Institute of Technology Jodhpur"
          }
        ]
      },
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "USD",
        "lowPrice": "0",
        "highPrice": "199",
        "offerCount": "4"
      },
      "featureList": [
        "Natural Language to SQL & Python Code Synthesis",
        "Autonomous Multi-Agent Data Science Workflows",
        "Prophet & Neural Time-Series Predictive Forecasting",
        "Interactive Collaborative Python & SQL Notebooks",
        "Deterministic Zero-Hallucination Causal Verification",
        "Enterprise Air-Gapped Zero Data Retention Architecture"
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": BASE_URL
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": formattedTitle.replace(" | Vivexa Enterprise AI", ""),
          "item": fullCanonical
        }
      ]
    }
  ];

  const finalSchemas = structuredData 
    ? (Array.isArray(structuredData) ? [...defaultSchemas, ...structuredData] : [...defaultSchemas, structuredData])
    : defaultSchemas;

  return (
    <Helmet>
      <title>{formattedTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(", ")} />
      
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      <link rel="canonical" href={fullCanonical} />

      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={formattedTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Vivexa AI" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonical} />
      <meta name="twitter:title" content={formattedTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:creator" content="@vivexa_ai" />

      <script type="application/ld+json">
        {JSON.stringify(finalSchemas)}
      </script>
    </Helmet>
  );
}
