# SEO & Structured Data Specification — Phase 10

This document defines the search engine optimization (SEO) architecture, Schema.org JSON-LD structured data formats, dynamic XML sitemap generation rules, and crawler indexing policies implemented for **ReadToImprove**.

---

## 1. Schema.org JSON-LD Structured Data

### 1.1 WebSite Schema (with Sitelinks SearchAction)
- **Target Route**: Homepage (`/`)
- **Specification**:
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "ReadToImprove",
  "alternateName": "Đọc Báo Song Ngữ Anh-Việt",
  "url": "https://readtoimprove.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://readtoimprove.com/articles?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```
- **SEO Benefit**: Enables Google to display a direct Sitelinks Search Box within search results for brand queries.

---

### 1.2 NewsArticle / Article Schema
- **Target Route**: Article Detail & Bilingual Reader (`/articles/[slug]`)
- **Specification**:
```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Renewable Energy Transition in Southeast Asia",
  "alternativeHeadline": "Chuyển Dịch Năng Lượng Tái Tạo Tại Đông Nam Á",
  "description": "Comprehensive bilingual analysis of clean power investments across ASEAN.",
  "image": ["https://readtoimprove.com/api/og?title=Renewable%20Energy&level=B2&category=Environment"],
  "datePublished": "2026-09-14T10:00:00.000Z",
  "dateModified": "2026-09-20T14:30:00.000Z",
  "author": [
    {
      "@type": "Organization",
      "name": "Reuters Clean Energy",
      "url": "https://reuters.com/energy"
    }
  ],
  "publisher": {
    "@type": "Organization",
    "name": "ReadToImprove",
    "url": "https://readtoimprove.com"
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://readtoimprove.com/articles/renewable-energy-asean"
  }
}
```
- **SEO Benefit**: Eligible for Google News carousel, rich snippets, publication dates, and article cards in mobile discovery feeds.

---

### 1.3 BreadcrumbList Schema
- **Target Routes**: `/articles`, `/articles/[slug]`, `/categories`, `/categories/[slug]`
- **Specification**:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Trang chủ",
      "item": "https://readtoimprove.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Chủ đề tin tức",
      "item": "https://readtoimprove.com/categories"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Môi trường",
      "item": "https://readtoimprove.com/categories/environment"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Renewable Energy Transition in Southeast Asia",
      "item": "https://readtoimprove.com/articles/renewable-energy-asean"
    }
  ]
}
```
- **SEO Benefit**: Replaces raw URL paths with structured hierarchical navigation breadcrumbs directly in Google SERP results.

---

## 2. Dynamic XML Sitemap Policy (`/sitemap.xml`)

Implemented in `src/app/sitemap.ts`:
1. **Inclusion Criteria**:
   - Static Core Public Routes: `/`, `/articles`, `/categories` (Priority: 1.0 – 0.8, Daily/Weekly).
   - Published Articles: Query condition `status === 'PUBLISHED' && publishedAt <= new Date()`. Includes `lastModified` and `priority: 0.8`.
   - Public Categories: All active categories from database with `priority: 0.7`.
2. **Exclusion Criteria**:
   - Private Stealth Admin: `/secure-console-x7*`.
   - Authenticated Learner Profiles: `/me/*`.
   - Personal Word Bank: `/word-bank`.
   - Authentication Endpoints: `/login`, `/register`.
   - Raw API routes: `/api/*`.

---

## 3. Crawler Indexing Policy (`/robots.txt`)

Implemented in `src/app/robots.ts`:
```text
User-agent: *
Allow: /
Disallow: /secure-console-x7/*
Disallow: /secure-console-x7
Disallow: /api/*
Disallow: /me/*
Disallow: /me
Disallow: /word-bank/*
Disallow: /word-bank

Sitemap: https://readtoimprove.com/sitemap.xml
```

---

## 4. Canonical URL Enforcement

Every public route exports an explicit `alternates.canonical` matching its canonical path without tracking parameters:
- `/` $\rightarrow$ `https://readtoimprove.com/`
- `/articles` $\rightarrow$ `https://readtoimprove.com/articles` (strips search queries like `?q=...&level=...`)
- `/articles/[slug]` $\rightarrow$ `https://readtoimprove.com/articles/[slug]`
- `/categories` $\rightarrow$ `https://readtoimprove.com/categories`
- `/categories/[slug]` $\rightarrow$ `https://readtoimprove.com/categories/[slug]`
