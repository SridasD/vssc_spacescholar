export interface ElasticsearchConnection {
  node: string;
  scheme: string;
  port: number;
  apiKey?: string;
}

export interface ElasticsearchTLSConfig {
  ca: Buffer;
  rejectUnauthorized: boolean;
}

export interface ElasticsearchClientConfig {
  connection: ElasticsearchConnection;
  tls?: ElasticsearchTLSConfig;
}