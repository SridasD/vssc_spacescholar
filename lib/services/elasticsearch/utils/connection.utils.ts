import { env } from '@/lib/config/env.config';
import { ElasticsearchConnection } from '../types/client.types';

export function buildConnectionConfig(): ElasticsearchConnection {
  const node = env.ELASTICSEARCH_NODE;
  
  return {
    node,
    scheme: env.ELASTICSEARCH_SCHEME,
    port: parseInt(env.ELASTICSEARCH_PORT, 10),
    apiKey: env.ELASTICSEARCH_API_KEY,
  };
}