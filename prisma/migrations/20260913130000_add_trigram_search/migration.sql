-- Enable trigram extension for fuzzy & substring search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN indexes for fast ILIKE '%...%' search
CREATE INDEX IF NOT EXISTS "Vocabulary_word_trgm_idx"
  ON "Vocabulary" USING GIN (word gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Vocabulary_meaningVi_trgm_idx"
  ON "Vocabulary" USING GIN ("meaningVi" gin_trgm_ops);
