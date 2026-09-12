import { z } from 'zod';
import { CefrLevel } from '@prisma/client';

export const publicArticlesQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(100, 'Search query is too long')
    .optional()
    .transform((val) => {
      if (!val || val.length < 2) return undefined;
      return val;
    }),
  category: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  level: z
    .nativeEnum(CefrLevel)
    .optional()
    .catch(undefined),
  page: z
    .coerce
    .number()
    .int()
    .min(1)
    .max(1000)
    .default(1)
    .catch(1),
});

export type PublicArticlesQuery = z.infer<typeof publicArticlesQuerySchema>;
