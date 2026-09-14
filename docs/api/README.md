# ReadToImprove API Contracts

## Overview
This directory contains API specifications and contracts for **ReadToImprove**.

- `openapi.yaml`: OpenAPI 3.1.0 specification defining public API contracts.

## Incremental Specification Strategy
1. **Phase 08 Initiation**: `openapi.yaml` is initiated in Phase 08 focusing on the public Search & Autocomplete API surfaces (`/api/search` and `/api/search/suggestions`).
2. **Backfill Plan (Phases 01–07)**:
   - Phase 03: Authentication routes (`/api/auth/*`)
   - Phase 04: Stealth Admin CMS Server Actions & route handlers
   - Phase 07: Personal Word Bank and vocabulary actions
3. **Future Expansions**:
   - Phase 09: User Reading History & Bookmark APIs
   - Phase 10: Spaced Repetition Flashcards & Mastery Quiz APIs
