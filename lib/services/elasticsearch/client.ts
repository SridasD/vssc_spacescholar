import { Client } from '@elastic/elasticsearch';
import { elasticsearchConfig } from '@/lib/config/elasticsearch.config';
import { certificateManager } from '@/lib/config/certificate.config';
import { ElasticsearchClientOptions } from '@/lib/types/elasticsearch.types';

class ElasticsearchClient {
  private static instance: Client;

  private constructor() {}

  public static getInstance(): Client {
    if (!ElasticsearchClient.instance) {
      const options: ElasticsearchClientOptions = {
        node: `${elasticsearchConfig.scheme}://${elasticsearchConfig.node}:${elasticsearchConfig.port}`,
      };

      if (elasticsearchConfig.apiKey) {
        options.auth = {
          apiKey: elasticsearchConfig.apiKey,
        };
      }

      const certificate = certificateManager.getCertificate();
      if (certificate) {
        options.tls = {
          ca: certificate,
          rejectUnauthorized: true, // Enable SSL verification
        };
      }

      ElasticsearchClient.instance = new Client(options);
    }

    return ElasticsearchClient.instance;
  }
}

export const getElasticsearchClient = () => ElasticsearchClient.getInstance();