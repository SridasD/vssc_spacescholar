import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = "https://postman-echo.com/post";
// process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Interfaces with enhanced detail for comprehensive endpoint testing
interface ConnectionOptions {
  // Connection parameters
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  followRedirects?: boolean;
  maxRedirects?: number;
  
  // Validation parameters
  validateSSL?: boolean;
  expectedContentType?: string;
  allowedStatusCodes?: number[];
  
  // Authentication
  authToken?: string;
  
  // Request details
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: any;
  
  // Protocol validation
  skipDNSValidation?: boolean;
  checkCORS?: boolean;
  expectedOrigin?: string;
  
  // Diagnostic flags
  includeRawResponse?: boolean;
  verboseLogging?: boolean;
}

// Enhanced result interface with detailed metrics
interface ConnectionResult {
  status: "success" | "error" | "partial_success";
  message: string;
  timestamp: string;
  requestMetrics: {
    dnsResolutionTimeMs: number;
    connectionEstablishmentTimeMs: number;
    ttfbMs: number;
    totalResponseTimeMs: number;
    redirectCount: number;
    compressionRatio: number | null;
    retryCount: number;
  };
  connectionDetails: {
    socketConnected: boolean;
    tlsValid: boolean | null;
    ipResolved: string | null;
    protocol: "HTTP/1.1" | "HTTP/2" | "HTTP/3" | null;
  };
  httpDetails: {
    statusCode: number | null;
    statusText: string;
    method: string;
    allowedMethods: string[] | null;
    contentType: string | null;
    contentLength: number | null;
  };
  corsStatus: {
    isCompliant: boolean | null;
    violations: string[];
    allowedOrigins: string[] | null;
  };
  parameterValidation: {
    missingParameters: string[];
    invalidParameters: Array<{
      name: string;
      error: string;
      expectedType: string | null;
      providedValue: string | null;
    }>;
  };
  rawResponse: string | null;
  debugInfo: Record<string, any>;
}

// Backward compatibility with existing ProductionAPICheckResult
interface ProductionAPICheckResult {
  success: boolean;
  isLive: boolean;
  connectionStatus: "UP" | "DOWN" | "DEGRADED";
  message: string;
  statusCode?: number;
  statusCategory:
    | "SUCCESS"
    | "REDIRECT"
    | "CLIENT_ERROR"
    | "SERVER_ERROR"
    | "NETWORK_ERROR"
    | "UNKNOWN";
  issues: {
    cors?: string[];
    ssl?: string[];
    network?: string[];
    headers?: string[];
    performance?: string[];
    authentication?: string[];
    general?: string[];
  };
  metrics: {
    totalTime: number;
    dnsTime?: number;
    connectionTime?: number;
    retryCount: number;
    finalUrl?: string;
  };
  detailedResponse: {
    headers: Record<string, string>;
    redirectChain?: string[];
    corsHeaders: {
      "access-control-allow-origin"?: string;
      "access-control-allow-methods"?: string;
      "access-control-allow-headers"?: string;
      "access-control-allow-credentials"?: string;
    };
  };
}

// Default monitoring configuration with enhanced options
const DEFAULT_OPTIONS: ConnectionOptions = {
  timeout: 10000,
  maxRetries: 3,
  retryDelay: 3000,
  validateSSL: true,
  expectedContentType: "application/json",
  allowedStatusCodes: [200, 201, 202, 204],
  method: "GET",
  followRedirects: true,
  maxRedirects: 5,
  checkCORS: true,
  headers: {
    "X-Monitor-Source": "api-endpoint-tester",
    "Accept": "application/json, text/plain, */*",
    "User-Agent": "API-Endpoint-Tester/2.0",
    "Cache-Control": "no-cache",
  },
  includeRawResponse: false,
  verboseLogging: false,
};
/**
 * Check CORS headers for compliance with expected origin
 * Analyzes CORS headers to identify potential violations and misconfigurations
 */
function checkCORSHeaders(
  corsHeaders: Record<string, string | undefined>,
  expectedOrigin: string
): string[] {
  const issues: string[] = [];

  if (!corsHeaders['access-control-allow-origin']) {
    issues.push('Missing Access-Control-Allow-Origin header');
  } else if (
    corsHeaders['access-control-allow-origin'] !== '*' &&
    corsHeaders['access-control-allow-origin'] !== expectedOrigin
  ) {
    issues.push(`CORS origin mismatch: Expected ${expectedOrigin}, got ${corsHeaders['access-control-allow-origin']}`);
  }

  if (!corsHeaders['access-control-allow-methods']) {
    issues.push('Missing Access-Control-Allow-Methods header');
  }

  // Check if credentials allowed but origin is wildcard (security issue)
  if (
    corsHeaders['access-control-allow-credentials'] === 'true' &&
    corsHeaders['access-control-allow-origin'] === '*'
  ) {
    issues.push('Security warning: Access-Control-Allow-Credentials is true but origin is wildcard (*)');
  }

  return issues;
}




/**
 * Enhanced Monitor Connection Status function with comprehensive diagnostics
 * @param targetUrl API endpoint URL to test
 * @param options Configuration options
 * @returns Detailed connection result
 */
async function monitorConnectionStatus(
  targetUrl: string,
  options: ConnectionOptions = {}
): Promise<ConnectionResult> {
  // Merge with default options
  const testOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Initialize metrics tracking
  const metrics = {
    startTime: Date.now(),
    dnsStartTime: 0,
    dnsEndTime: 0,
    connectionStartTime: 0,
    connectionEndTime: 0,
    ttfbStartTime: 0,
    ttfbEndTime: 0,
    endTime: 0,
    redirectCount: 0,
  };
  
  // Initialize result object
  const result: ConnectionResult = {
    status: "error",
    timestamp: new Date().toISOString(),
    message: "Initializing API endpoint test",
    requestMetrics: {
      dnsResolutionTimeMs: 0,
      connectionEstablishmentTimeMs: 0,
      ttfbMs: 0,
      totalResponseTimeMs: 0,
      redirectCount: 0,
      compressionRatio: null,
      retryCount: 0
    },
    connectionDetails: {
      socketConnected: false,
      tlsValid: null,
      ipResolved: null,
      protocol: null,
    },
    httpDetails: {
      statusCode: null,
      statusText: "Not Connected",
      method: testOptions.method || "GET",
      allowedMethods: null,
      contentType: null,
      contentLength: null,
    },
    corsStatus: {
      isCompliant: null,
      violations: [],
      allowedOrigins: null,
    },
    parameterValidation: {
      missingParameters: [],
      invalidParameters: [],
    },
    rawResponse: null,
    debugInfo: {},
  };
  
  let attempts = 0;
  let lastError: any = null;
  
  // URL validation and DNS pre-flight
  try {
    const url = new URL(targetUrl);
    result.debugInfo.urlParsed = {
      protocol: url.protocol,
      hostname: url.hostname,
      pathname: url.pathname,
      searchParams: Object.fromEntries(url.searchParams),
    };
    
    // Mark TLS for HTTPS endpoints
    if (url.protocol === 'https:') {
      result.connectionDetails.tlsValid = testOptions.validateSSL !== false;
    }
    
    // Warn about localhost in production
    if (['localhost', '127.0.0.1'].includes(url.hostname)) {
      result.debugInfo.warnings = [...(result.debugInfo.warnings || []), 'Testing localhost URL'];
    }
  } catch (error) {
    result.message = `Invalid URL format: ${error instanceof Error ? error.message : String(error)}`;
    return result;
  }
  
  // Prepare request headers
  const requestHeaders: Record<string, string> = {
    ...testOptions.headers,
  };
  
  if (testOptions.authToken) {
    requestHeaders["Authorization"] = `Bearer ${testOptions.authToken}`;
  }
  
  if (testOptions.checkCORS) {
    requestHeaders["Origin"] = testOptions.expectedOrigin || 
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  }
  
  // Retry logic
  while (attempts <= testOptions.maxRetries!) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), testOptions.timeout);
      
      metrics.connectionStartTime = Date.now();
      
      try {
        // Execute the fetch request
        const response = await fetch(targetUrl, {
          method: testOptions.method,
          headers: requestHeaders,
          signal: controller.signal,
          mode: testOptions.checkCORS ? 'cors' : 'no-cors',
          credentials: 'omit',
          redirect: testOptions.followRedirects ? 'follow' : 'manual',
          body: testOptions.body ? JSON.stringify(testOptions.body) : undefined,
        });
        
        // Record metrics
        metrics.connectionEndTime = Date.now();
        metrics.ttfbEndTime = Date.now();
        result.requestMetrics.ttfbMs = metrics.ttfbEndTime - metrics.connectionEndTime;
        result.connectionDetails.socketConnected = true;
        
        // Parse response headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key.toLowerCase()] = value;
        });
        
        // Extract protocol information
        if (responseHeaders['x-powered-by']) {
          result.debugInfo.serverInfo = responseHeaders['x-powered-by'];
        }
        
        // Detect HTTP version if available
        if (responseHeaders['via']) {
          const viaHeader = responseHeaders['via'];
          if (viaHeader.includes('HTTP/2')) {
            result.connectionDetails.protocol = 'HTTP/2';
          } else if (viaHeader.includes('HTTP/1.1')) {
            result.connectionDetails.protocol = 'HTTP/1.1';
          } else if (viaHeader.includes('HTTP/3')) {
            result.connectionDetails.protocol = 'HTTP/3';
          }
        } else {
          result.connectionDetails.protocol = 'HTTP/1.1'; // Default assumption
        }
        
        const contentType = responseHeaders['content-type'];
        const contentLength = responseHeaders['content-length'] ? 
          parseInt(responseHeaders['content-length']) : null;
        
        // Update HTTP details in result
        result.httpDetails = {
          statusCode: response.status,
          statusText: response.statusText || getStatusText(response.status),
          method: testOptions.method || 'GET',
          allowedMethods: responseHeaders['allow'] ? 
            responseHeaders['allow'].split(',').map(m => m.trim()) : null,
          contentType,
          contentLength,
        };
        
        // Extract CORS information
        if (testOptions.checkCORS) {
          const corsHeaders = {
            'access-control-allow-origin': responseHeaders['access-control-allow-origin'],
            'access-control-allow-methods': responseHeaders['access-control-allow-methods'],
            'access-control-allow-headers': responseHeaders['access-control-allow-headers'],
            'access-control-allow-credentials': responseHeaders['access-control-allow-credentials'],
          };
          
          const corsViolations = checkCORSHeaders(corsHeaders, 
            testOptions.expectedOrigin || 
            (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'));
          
          result.corsStatus = {
            isCompliant: corsViolations.length === 0,
            violations: corsViolations,
            allowedOrigins: corsHeaders['access-control-allow-origin'] ? 
              [corsHeaders['access-control-allow-origin']] : null,
          };
        }
        
        // Handle redirect counts
        if (response.redirected) {
          result.requestMetrics.redirectCount = 1; // Basic implementation
        }
        
        // Store raw response if requested
        if (testOptions.includeRawResponse) {
          try {
            const clonedResponse = response.clone();
            const rawText = await clonedResponse.text();
            result.rawResponse = rawText.length > 10000 ? 
              `${rawText.substring(0, 10000)}... [truncated, total length: ${rawText.length}]` : 
              rawText;
              
            // Calculate compression ratio if Content-Encoding is present
            if (responseHeaders['content-encoding'] && responseHeaders['content-length']) {
              const encodedSize = parseInt(responseHeaders['content-length']);
              const decodedSize = rawText.length;
              result.requestMetrics.compressionRatio = encodedSize / decodedSize;
            }
          } catch (e) {
            result.debugInfo.rawResponseError = String(e);
          }
        }
        
        // Parameter validation - look for common patterns in error responses
        if (response.status === 400) {
          try {
            const textResponse = await response.text();
            let jsonResponse;
            
            try {
              jsonResponse = JSON.parse(textResponse);
            } catch {
              // Not JSON, use text response
              result.debugInfo.responseText = textResponse.substring(0, 500);
              
              // Look for parameter names in error message
              const paramMatches = textResponse.match(/['"]([^'"]+)['"]/g);
              if (paramMatches) {
                for (const match of paramMatches) {
                  const param = match.replace(/['"]/g, '');
                  if (!result.parameterValidation.missingParameters.includes(param)) {
                    result.parameterValidation.missingParameters.push(param);
                  }
                }
              }
            }
            
            // Extract validation errors from JSON response
            if (jsonResponse) {
              // Handle common error formats
              if (jsonResponse.errors) {
                if (Array.isArray(jsonResponse.errors)) {
                  for (const error of jsonResponse.errors) {
                    if (error.param || error.field) {
                      result.parameterValidation.invalidParameters.push({
                        name: error.param || error.field,
                        error: error.message || error.msg || "Invalid value",
                        expectedType: error.type || null,
                        providedValue: error.value ? String(error.value) : null,
                      });
                    }
                  }
                } else if (typeof jsonResponse.errors === 'object') {
                  for (const [field, message] of Object.entries(jsonResponse.errors)) {
                    result.parameterValidation.invalidParameters.push({
                      name: field,
                      error: typeof message === 'string' ? message : JSON.stringify(message),
                      expectedType: null,
                      providedValue: null,
                    });
                  }
                }
              } else if (jsonResponse.message) {
                // Extract parameter names from error message
                const paramMatches = jsonResponse.message.match(/['"]([^'"]+)['"]/g);
                if (paramMatches) {
                  for (const match of paramMatches) {
                    const param = match.replace(/['"]/g, '');
                    if (!result.parameterValidation.missingParameters.includes(param)) {
                      result.parameterValidation.missingParameters.push(param);
                    }
                  }
                }
              }
              
              result.debugInfo.validationResponse = jsonResponse;
            }
          } catch (e) {
            result.debugInfo.validationError = String(e);
          }
        } else if (response.status === 405) {
          // Method Not Allowed - extract allowed methods
          if (responseHeaders['allow']) {
            result.httpDetails.allowedMethods = responseHeaders['allow']
              .split(',')
              .map(m => m.trim());
          }
        }
        
        // Determine status category and set message
        const { message, status } = getStatusInfo(response.status, response.statusText, result);
        result.message = message;
        result.status = status;
        
        // Record final metrics
        metrics.endTime = Date.now();
        result.requestMetrics.totalResponseTimeMs = metrics.endTime - metrics.startTime;
        result.requestMetrics.connectionEstablishmentTimeMs = 
          metrics.connectionEndTime - metrics.connectionStartTime;
        result.requestMetrics.retryCount = attempts;
        
        // Clean up timeout
        clearTimeout(timeoutId);
        
        return result;
      } catch (error) {
        // Clean up timeout
        clearTimeout(timeoutId);
        lastError = error;
        
        // Handle specific error types
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            result.message = `Connection timeout after ${testOptions.timeout}ms`;
          } else if (error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
            result.message = `Network error: Unable to connect to server`;
          } else if (error.message.includes('CORS')) {
            result.message = `CORS policy violation: ${error.message}`;
            result.corsStatus.violations.push(error.message);
            result.corsStatus.isCompliant = false;
          } else {
            result.message = `Request error: ${error.message}`;
          }
          
          result.debugInfo.lastError = {
            name: error.name,
            message: error.message,
            stack: error.stack,
          };
        } else {
          result.message = `Unknown error: ${String(error)}`;
          result.debugInfo.lastError = String(error);
        }
      }
    } catch (unexpectedError) {
      lastError = unexpectedError;
      result.message = `Unexpected error: ${String(unexpectedError)}`;
      result.debugInfo.unexpectedError = String(unexpectedError);
    }
    
    attempts++;
    
    // Wait before retry
    if (attempts <= testOptions.maxRetries!) {
      await new Promise(resolve => setTimeout(resolve, testOptions.retryDelay));
    }
  }
  
  // All retries exhausted
  metrics.endTime = Date.now();
  result.requestMetrics.totalResponseTimeMs = metrics.endTime - metrics.startTime;
  result.requestMetrics.retryCount = attempts;
  result.message = `Connection failed after ${attempts} attempts: ${result.message}`;
  
  return result;
}

/**
 * Get human-readable status text for common HTTP status codes
 */
function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    307: 'Temporary Redirect',
    308: 'Permanent Redirect',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    413: 'Payload Too Large',
    414: 'URI Too Long',
    415: 'Unsupported Media Type',
    416: 'Range Not Satisfiable',
    422: 'Unprocessable Entity',
    426: 'Upgrade Required',
    428: 'Precondition Required',
    429: 'Too Many Requests',
    431: 'Request Header Fields Too Large',
    451: 'Unavailable For Legal Reasons',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
    506: 'Variant Also Negotiates',
    507: 'Insufficient Storage',
    508: 'Loop Detected',
    510: 'Not Extended',
    511: 'Network Authentication Required',
  };
  return statusTexts[status] || 'Unknown Status';
}

/**
 * Determine status information based on HTTP status code
 */
function getStatusInfo(statusCode: number, statusText: string, result: ConnectionResult): {
  message: string;
  status: "success" | "error" | "partial_success";
} {
  // Success cases
  if (statusCode >= 200 && statusCode < 300) {
    return {
      message: `Connection successful: ${statusCode} ${statusText}`,
      status: "success"
    };
  }
  
  // Redirect cases
  if (statusCode >= 300 && statusCode < 400) {
    return {
      message: `Redirect detected: ${statusCode} ${statusText}`,
      status: result.connectionDetails.socketConnected ? "partial_success" : "error"
    };
  }
  
  // Client error cases
  if (statusCode >= 400 && statusCode < 500) {
    let message = "";
    
    switch (statusCode) {
      case 400:
        message = "Bad Request: Parameter validation failed";
        if (result.parameterValidation.missingParameters.length > 0) {
          message += `. Missing parameters: ${result.parameterValidation.missingParameters.join(', ')}`;
        }
        if (result.parameterValidation.invalidParameters.length > 0) {
          message += `. Invalid parameters: ${result.parameterValidation.invalidParameters.map(p => p.name).join(', ')}`;
        }
        break;
      case 401:
        message = "Authentication required";
        break;
      case 403:
        message = "Authorization failed";
        break;
      case 404:
        message = "Endpoint not found";
        break;
      case 405:
        message = `Method ${result.httpDetails.method} not allowed`;
        if (result.httpDetails.allowedMethods && result.httpDetails.allowedMethods.length > 0) {
          message += `. Allowed methods: ${result.httpDetails.allowedMethods.join(', ')}`;
        }
        break;
      case 429:
        message = "Rate limit exceeded";
        break;
      default:
        message = `Client error: ${statusCode} ${statusText}`;
    }
    
    return { message, status: "error" };
  }
  
  // Server error cases
  if (statusCode >= 500) {
    return {
      message: `Server error: ${statusCode} ${statusText}`,
      status: "error"
    };
  }
  
  // Fallback
  return {
    message: `Unexpected status code: ${statusCode}`,
    status: "error"
  };
}

/**
 * Convert enhanced ConnectionResult to legacy ProductionAPICheckResult for backward compatibility
 */
function convertToProductionAPICheckResult(result: ConnectionResult): ProductionAPICheckResult {
  // Map status categories
  let statusCategory: ProductionAPICheckResult["statusCategory"] = "UNKNOWN";
  if (result.httpDetails.statusCode) {
    if (result.httpDetails.statusCode >= 200 && result.httpDetails.statusCode < 300) {
      statusCategory = "SUCCESS";
    } else if (result.httpDetails.statusCode >= 300 && result.httpDetails.statusCode < 400) {
      statusCategory = "REDIRECT";
    } else if (result.httpDetails.statusCode >= 400 && result.httpDetails.statusCode < 500) {
      statusCategory = "CLIENT_ERROR";
    } else if (result.httpDetails.statusCode >= 500) {
      statusCategory = "SERVER_ERROR";
    }
  } else {
    statusCategory = "NETWORK_ERROR";
  }
  
  // Convert issues
  const issues: ProductionAPICheckResult["issues"] = {};
  
  // Map CORS issues
  if (result.corsStatus.violations.length > 0) {
    issues.cors = result.corsStatus.violations;
  }
  
  // Map TLS/SSL issues
  if (result.connectionDetails.tlsValid === false) {
    issues.ssl = ["SSL validation failed"];
  }
  
  // Map network issues
  if (!result.connectionDetails.socketConnected) {
    issues.network = ["Connection failed"];
  }
  
  // Map header issues
  if (result.status === "partial_success" && result.httpDetails.contentType) {
    issues.headers = ["Content-Type mismatch"];
  }
  
  // Map performance issues
  if (result.requestMetrics.totalResponseTimeMs > 5000) {
    issues.performance = [`Slow response time: ${result.requestMetrics.totalResponseTimeMs}ms`];
  }
  
  // Check for authentication issues
  if (result.httpDetails.statusCode === 401 || result.httpDetails.statusCode === 403) {
    issues.authentication = ["Authentication failed"];
  }
  
  // Map other general issues
  if (result.status === "error" && !Object.keys(issues).length) {
    issues.general = [result.message];
  }
  
  // Determine connection status
  let connectionStatus: "UP" | "DOWN" | "DEGRADED" = "DOWN";
  if (result.status === "success") {
    connectionStatus = "UP";
  } else if (result.status === "partial_success") {
    connectionStatus = "DEGRADED";
  }
  
  // Convert response headers if available
  const corsHeaders: ProductionAPICheckResult["detailedResponse"]["corsHeaders"] = {};
  if (result.corsStatus.allowedOrigins && result.corsStatus.allowedOrigins.length > 0) {
    corsHeaders["access-control-allow-origin"] = result.corsStatus.allowedOrigins[0];
  }
  
  return {
    success: result.status === "success" || result.status === "partial_success",
    isLive: result.status === "success" || result.status === "partial_success",
    connectionStatus,
    message: result.message,
    statusCode: result.httpDetails.statusCode || undefined,
    statusCategory,
    issues,
    metrics: {
      totalTime: result.requestMetrics.totalResponseTimeMs,
      dnsTime: result.requestMetrics.dnsResolutionTimeMs,
      connectionTime: result.requestMetrics.connectionEstablishmentTimeMs,
      retryCount: result.requestMetrics.retryCount,
    },
    detailedResponse: {
      headers: {},  // Would need actual headers from the response
      corsHeaders
    }
  };
}

/**
 * Enhanced checkProductionAPIHealth with better diagnostics
 */
async function checkProductionAPIHealth(
  targetUrl: string,
  options: ConnectionOptions & {
    checkCORS?: boolean;
    expectedOrigin?: string;
    followRedirects?: boolean;
    checkSSL?: boolean;
  } = {}
): Promise<ProductionAPICheckResult> {
  // Convert the legacy options to the new format
  const monitorOptions: ConnectionOptions = {
    ...options,
    validateSSL: options.checkSSL,
    includeRawResponse: true,
  };
  
  // Use the enhanced monitoring function
  const result = await monitorConnectionStatus(targetUrl, monitorOptions);
  
  // Convert to the legacy format for backward compatibility
  return convertToProductionAPICheckResult(result);
}

/**
 * Main API endpoint test route
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const endpoint = searchParams.get("endpoint") || "";
  const targetUrl = endpoint.startsWith('http') ? 
    endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  // Check if production mode is requested
  const productionMode = searchParams.get("production") === "true";
  
  // Parse options from query parameters
  const options: ConnectionOptions = {
    timeout: searchParams.get("timeout") ? 
      parseInt(searchParams.get("timeout")!) : DEFAULT_OPTIONS.timeout,
    maxRetries: searchParams.get("maxRetries") ? 
      parseInt(searchParams.get("maxRetries")!) : DEFAULT_OPTIONS.maxRetries,
    method: (searchParams.get("method") as ConnectionOptions["method"]) || DEFAULT_OPTIONS.method,
    followRedirects: searchParams.get("followRedirects") !== "false",
    validateSSL: searchParams.get("validateSSL") !== "false",
    checkCORS: searchParams.get("checkCORS") !== "false",
    includeRawResponse: searchParams.get("includeRawResponse") === "true",
    verboseLogging: searchParams.get("verbose") === "true",
    skipDNSValidation: searchParams.get("skipDNS") === "true",
  };
  
  // Get authentication token from headers or query
  const authToken = req.headers.get("authorization")?.replace("Bearer ", "") || 
    searchParams.get("auth") || undefined;
  
  if (authToken) {
    options.authToken = authToken;
  }
  
  // Extract custom headers if provided
  const customHeaderString = searchParams.get("headers");
  if (customHeaderString) {
    try {
      const customHeaders = JSON.parse(customHeaderString);
      options.headers = { ...DEFAULT_OPTIONS.headers, ...customHeaders };
    } catch (e) {
      return NextResponse.json(
        {
          status: "error",
          message: `Invalid headers format: ${e instanceof Error ? e.message : String(e)}`,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
  }
  
  // Extract request body if provided
  const bodyString = searchParams.get("body");
  if (bodyString) {
    try {
      options.body = JSON.parse(bodyString);
    } catch (e) {
      return NextResponse.json(
        {
          status: "error",
          message: `Invalid body format: ${e instanceof Error ? e.message : String(e)}`,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
  }

  try {
    if (productionMode) {
      // Use legacy production health check for backward compatibility
      const result = await checkProductionAPIHealth(targetUrl, {
        ...options,
        checkSSL: options.validateSSL,
      });

      return NextResponse.json(
        {
          ...result,
          productionInfo: {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            checker: "production-api-health-check/2.0",
            reportUrl: req.nextUrl.toString(),
          },
        },
        {
          status: result.success ? 200 : 503,
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "X-API-Health-Status": result.connectionStatus,
            "X-Response-Time": `${result.metrics.totalTime}ms`,
          },
        }
      );
    } else {
      // Use enhanced monitoring
      const result = await monitorConnectionStatus(targetUrl, options);
      
      // Determine response status code based on test result
      const responseStatus = result.status === "success" ? 200 : 
        result.status === "partial_success" ? 207 : 
        result.httpDetails.statusCode ? 
          (result.httpDetails.statusCode >= 500 ? 502 : 400) : 503;
      
      return NextResponse.json(result, {
        status: responseStatus,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-API-Test-Status": result.status,
          "X-Response-Time": `${result.requestMetrics.totalResponseTimeMs}ms`,
        },
      });
    }
  } catch (error: any) {
    // Handle unexpected errors
    return NextResponse.json(
      {
        status: "error",
        message: `Endpoint test failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
        debugInfo: {
          error: error instanceof Error ? 
            { message: error.message, stack: error.stack } : String(error),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Bulk testing endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoints = [], productionMode = false } = body;
    
    // Validate endpoints format
    if (!Array.isArray(endpoints) || endpoints.length === 0) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid or empty endpoints array provided",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Process global options
    const globalOptions: ConnectionOptions = {};
    if (body.options) {
      Object.assign(globalOptions, body.options);
    }
    
    // Normalize endpoints data
    const testsToRun = endpoints.map((ep: any) => ({
      name: ep.name || ep.endpoint || ep.url || 'Unnamed endpoint',
      url: ep.url || (ep.endpoint ? 
        (ep.endpoint.startsWith('http') ? ep.endpoint : `${API_BASE_URL}${ep.endpoint.startsWith('/') ? '' : '/'}${ep.endpoint}`) :
        null),
      options: { ...globalOptions, ...(ep.options || {}) },
    }));
    
    // Validate URLs
    const invalidEndpoints = testsToRun.filter(ep => !ep.url);
    if (invalidEndpoints.length > 0) {
      return NextResponse.json(
        {
          status: "error",
          message: `Invalid endpoint URLs: ${invalidEndpoints.map(e => e.name).join(', ')}`,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    if (productionMode) {
      // Legacy production mode bulk check
      const bulkResults = await Promise.all(
        testsToRun.map(async ({ name, url, options }) => ({
          name,
          result: await checkProductionAPIHealth(url!, {
            ...DEFAULT_OPTIONS,
            ...options,
          }),
        }))
      );

      // Calculate overall health status
      const successCount = bulkResults.filter((r) => r.result.isLive).length;
      const overallSuccess = successCount === bulkResults.length;

      return NextResponse.json(
        {
          success: overallSuccess,
          summary: {
            total: bulkResults.length,
            live: successCount,
            down: bulkResults.length - successCount,
            degraded: bulkResults.filter(
              (r) => r.result.connectionStatus === "DEGRADED"
            ).length,
          },
          results: bulkResults,
          timestamp: new Date().toISOString(),
        },
        {
          status: overallSuccess ? 200 : 207, // Multi-Status for partial failures
        }
      );
    } else {
      // Enhanced bulk check
      const results = await Promise.all(
        testsToRun.map(async ({ name, url, options }) => ({
          name,
          result: await monitorConnectionStatus(url!, options),
        }))
      );

      const successCount = results.filter((r) => r.result.status === "success").length;
      const partialCount = results.filter((r) => r.result.status === "partial_success").length;
      const failureCount = results.filter((r) => r.result.status === "error").length;
      
      const overallSuccess = failureCount === 0;
      
      return NextResponse.json(
        {
          status: overallSuccess ? 
            (partialCount > 0 ? "partial_success" : "success") : "error",
          timestamp: new Date().toISOString(),
          summary: {
            total: results.length,
            successful: successCount,
            partial: partialCount,
            failed: failureCount,
          },
          results,
        },
        {
          status: overallSuccess ? (partialCount > 0 ? 207 : 200) : 500,
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: `Bulk test operation failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Advanced monitoring endpoint with full metrics
 */
export async function PUT(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const endpoint = searchParams.get("endpoint") || "/search";
    const targetUrl = endpoint.startsWith('http') ? 
      endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
      
    const productionMode = searchParams.get("production") === "true";

    // Get authentication token from headers or query
    const authToken =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      searchParams.get("auth") ||
      undefined;
      
    // Parse options
    const options: ConnectionOptions = {
      ...DEFAULT_OPTIONS,
      authToken,
      method: (searchParams.get("method") as ConnectionOptions["method"]) || "GET",
      timeout: searchParams.get("timeout") ? parseInt(searchParams.get("timeout")!) : DEFAULT_OPTIONS.timeout,
      checkCORS: searchParams.get("checkCORS") !== "false",
      followRedirects: searchParams.get("followRedirects") !== "false",
      includeRawResponse: true, // Always include raw response for advanced monitoring
    };

    if (productionMode) {
      // Production monitoring
      const result = await checkProductionAPIHealth(targetUrl, {
        ...options,
        checkSSL: options.validateSSL,
      });

      const enrichedResult = {
        ...result,
        monitoring: {
          targetUrl,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          monitoringSource: "production-health-api",
        },
      };

      return NextResponse.json(enrichedResult, {
        status: result.success ? 200 : 500,
        headers: {
          "X-Response-Time": `${result.metrics.totalTime}ms`,
          "X-Retry-Count": result.metrics.retryCount.toString(),
          "X-Connection-Status": result.connectionStatus,
        },
      });
    } else {
      // Enhanced advanced monitoring
      const result = await monitorConnectionStatus(targetUrl, options);

      const enrichedResult = {
        ...result,
        monitoring: {
          targetUrl,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          monitoringSource: "enhanced-api-tester",
        },
      };

      return NextResponse.json(enrichedResult, {
        status: result.status === "success" ? 200 : 
               result.status === "partial_success" ? 207 : 500,
        headers: {
          "X-Response-Time": `${result.requestMetrics.totalResponseTimeMs}ms`,
          "X-Retry-Count": result.requestMetrics.retryCount.toString(),
          "X-Test-Status": result.status,
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json(
        {
          status: "error",
          message: `Advanced monitoring failed: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date().toISOString(),
          debugInfo: {
            error: error instanceof Error ? 
              { message: error.message, stack: error.stack } : String(error),
          },
        },
        { status: 500 }
      );
    }
  }