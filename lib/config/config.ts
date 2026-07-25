import { MAX_FILE_SIZE } from "../config/constants";

// Type definitions
interface ElasticsearchConfig {
  node: string;
  scheme: string;
  port: number;
  apiKey: string;
  certificate: string;
}

interface DatabaseConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
  useSsl: boolean;
}

interface AuthConfig {
  jwtSecret: string;
  jwtExpiry: string;
  nextAuthUrl: string;
  nextAuthSecret: string;
}

// Configuration with validation
export const config = {
  api: {
    baseUrl:
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "https://api.vsscchat.cdipd.in/v1",
  },
  limits: {
    maxFileSize: MAX_FILE_SIZE,
  },
  server: {
    port: parseInt(process.env.PORT || "3002", 10),
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE,
    scheme: process.env.ELASTICSEARCH_SCHEME,
    port: parseInt(process.env.ELASTICSEARCH_PORT || "9200", 10),
    apiKey: process.env.ELASTICSEARCH_API_KEY,
    certificate: process.env.ES_CERTIFICATE,
  } as ElasticsearchConfig,
  database: {
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
    database: process.env.POSTGRES_DATABASE,
    useSsl: process.env.POSTGRES_USE_SSL === "true",
  } as DatabaseConfig,
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiry: process.env.JWT_EXPIRY || "24h",
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nextAuthSecret: process.env.NEXTAUTH_SECRET,
  } as AuthConfig,
};

// Validation function
export function validateConfig() {
  // Add more detailed logging

  const requiredVars = [
    // "config.elasticsearch.node",
    // "config.elasticsearch.apiKey",
    "config.database.host",
    "config.database.password",
    "config.auth.jwtSecret",
  ];

  for (const path of requiredVars) {
    // Log each path we're checking
    const actualPath = path.replace(/^config\./, "");

    const value = actualPath
      .split(".")
      .reduce((obj, key) => obj?.[key], config as any);

    if (!value) {
      throw new Error(`Missing required configuration: ${actualPath}`);
    }
  }
}
