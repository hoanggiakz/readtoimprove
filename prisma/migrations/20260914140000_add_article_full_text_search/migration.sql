-- Migration: 20260914140000_add_article_full_text_search

-- 1. Ensure pg_trgm extension is active
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add generated searchVector column on Article
ALTER TABLE "Article" 
ADD COLUMN IF NOT EXISTS "searchVector" tsvector 
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce("titleEn", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("excerptEn", '')), 'B') ||
  setweight(to_tsvector('simple', coalesce("sourceName", '')), 'C')
) STORED;

-- 3. Create GIN index on searchVector for English full-text search with stemming
CREATE INDEX IF NOT EXISTS "Article_searchVector_idx" 
ON "Article" USING GIN ("searchVector");

-- 4. Create GIN Trigram indexes on titleEn and titleVi for substring & Vietnamese search
CREATE INDEX IF NOT EXISTS "Article_titleEn_trgm_idx" 
ON "Article" USING GIN ("titleEn" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Article_titleVi_trgm_idx" 
ON "Article" USING GIN ("titleVi" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Article_excerptVi_trgm_idx" 
ON "Article" USING GIN ("excerptVi" gin_trgm_ops);
