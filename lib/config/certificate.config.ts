import { readFileSync } from 'fs';
import { join } from 'path';

// Certificate management class
class CertificateManager {
  private static instance: CertificateManager;
  private certificate: Buffer | undefined;

  private constructor() {
    try {
      // First try to load from environment variable
      if (process.env.ES_CERTIFICATE) {
        this.certificate = Buffer.from(process.env.ES_CERTIFICATE, 'base64');
        return;
      }

      // Fallback to file system
      const certPath = join(process.cwd(), 'certificates', 'elasticsearch-ca.crt');
      this.certificate = readFileSync(certPath);
    } catch (error) {
      console.warn('Certificate not loaded:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  public static getInstance(): CertificateManager {
    if (!CertificateManager.instance) {
      CertificateManager.instance = new CertificateManager();
    }
    return CertificateManager.instance;
  }

  public getCertificate(): Buffer | undefined {
    return this.certificate;
  }
}

export const certificateManager = CertificateManager.getInstance();