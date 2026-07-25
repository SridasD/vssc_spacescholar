import { Client } from '@elastic/elasticsearch';
import { ElasticsearchClientConfig } from '../types/client.types';
import { buildConnectionConfig } from '../utils/connection.utils';
import { certificateManager } from '@/lib/config/certificate.config';

export class BaseElasticsearchClient {
  protected static instance: Client; 


  
  protected static createClient(): Client {
    try {
      console.log('Initializing Elasticsearch client...');
      
      const connection = buildConnectionConfig();
      const config: ElasticsearchClientConfig = {
        connection,
      };

      const certificate = certificateManager.getCertificate();
      
      const client = new Client({
        node: `${config.connection.scheme}://${config.connection.node}:${config.connection.port}`,
        auth: config.connection.apiKey ? { apiKey: config.connection.apiKey } : undefined,
        tls: {
          ca: certificate,
          rejectUnauthorized: false // Enable SSL verification for Cloudflare
        },
        maxRetries: 3,
        requestTimeout: 30000,
        compression: true, // Enable compression for Cloudflare
        headers: {
          'Accept-Encoding': 'gzip, deflate, br' // Support Cloudflare compression
        }
      });

      return client;
    } catch (error) {
      console.error('Error creating Elasticsearch client:', error);
      throw new Error('Failed to initialize Elasticsearch client');
    }
  }

  // protected static getInstance(): Client {
  //   if (!BaseElasticsearchClient.instance) {
  //     BaseElasticsearchClient.instance = BaseElasticsearchClient.createClient();
  //   }
  //   return BaseElasticsearchClient.instance;
  // }

  public static getInstance(): Client {
    if (!BaseElasticsearchClient.instance) {
      BaseElasticsearchClient.instance = BaseElasticsearchClient.createClient();
    }
    return BaseElasticsearchClient.instance;
  }
}