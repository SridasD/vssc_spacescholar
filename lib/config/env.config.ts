import { z } from 'zod';

const envSchema = z.object({
  ELASTICSEARCH_NODE: z.string().default('localhost'),
  ELASTICSEARCH_SCHEME: z.string().default('https'),
  ELASTICSEARCH_PORT: z.string().default('9200'),
  ELASTICSEARCH_API_KEY: z.string().optional(),
  ES_CERTIFICATE: z.string().optional(),
});

export const env = envSchema.parse(process.env);