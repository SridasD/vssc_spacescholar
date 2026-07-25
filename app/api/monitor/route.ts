import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/jwt";

/**
 * Enhanced API Endpoint Testing Utility
 *
 * A comprehensive diagnostic tool for validating API endpoints with detailed
 * analysis of connection status, protocol compliance, and error handling.
 *
 * @version 2.0.0
 */

// Define base URL for API testing
 const API_BASE_URL =   process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// This tool makes the server issue outbound HTTP requests on the caller's
// behalf (SSRF-shaped by design — that's the point of an endpoint tester).
// To prevent it being used to probe arbitrary internal/external hosts, only
// hostnames of services this app actually talks to may be targeted.
const ALLOWED_TARGET_HOSTS = new Set(
  [
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.NEXT_PUBLIC_API_UPLOADS_URL,
    process.env.ELASTICSEARCH_NODE,
    "http://localhost:8000",
  ]
    .filter((v): v is string => !!v)
    .map((v) => {
      try {
        return new URL(v).hostname;
      } catch {
        return null;
      }
    })
    .filter((v): v is string => !!v)
);

function isAllowedTargetUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return ALLOWED_TARGET_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

// Core Interfaces

/**
 * Configuration options for API endpoint testing
 */
interface EndpointTestOptions {
  // Connection parameters
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  followRedirects?: boolean;
  maxRedirects?: number;
  
  // Validation parameters
  validateTLS?: boolean;
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

/**
 * Comprehensive API endpoint test result
 */
interface EndpointTestResult {
  status: "success" | "error" | "partial_success";
  timestamp: string;
  requestMetrics: {
    dnsResolutionTimeMs: number;
    connectionEstablishmentTimeMs: number;
    ttfbMs: number;
    totalResponseTimeMs: number;
    redirectCount: number;
    compressionRatio: number | null;
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
  message: string;
  rawResponse: string | null;
  debugInfo: Record<string, any>;
}

// Default configuration
const DEFAULT_OPTIONS: EndpointTestOptions = {
  timeout: 10000,
  maxRetries: 3,
  retryDelay: 2000,
  followRedirects: true,
  maxRedirects: 5,
  validateTLS: true,
  expectedContentType: "application/json",
  allowedStatusCodes: [200, 201, 202, 204],
  method: "GET",
  headers: {
    "X-Test-Source": "api-endpoint-tester",
    "Accept": "application/json, text/plain, */*",
    "User-Agent": "API-Endpoint-Tester/2.0",
    "Cache-Control": "no-cache",
  },
  checkCORS: true,
  includeRawResponse: false,
  verboseLogging: false,
};

/**
 * Core API endpoint testing function
 * Performs comprehensive diagnostic tests on the provided API endpoint
 * 
 * @param targetUrl The URL to test
 * @param options Testing configuration options
 * @returns Detailed test results
 */
async function testApiEndpoint(targetUrl: string, options: EndpointTestOptions = {}): Promise<EndpointTestResult> {
  // Merge default options with provided options
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
  const result: EndpointTestResult = {
    status: "error",
    timestamp: new Date().toISOString(),
    requestMetrics: {
      dnsResolutionTimeMs: 0,
      connectionEstablishmentTimeMs: 0,
      ttfbMs: 0,
      totalResponseTimeMs: 0,
      redirectCount: 0,
      compressionRatio: null,
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
    message: "Initializing API endpoint test",
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
      result.connectionDetails.tlsValid = testOptions.validateTLS !== false;
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
          result.requestMetrics.redirectCount = testOptions.followRedirects ? 
            parseRedirectCount(response.url, targetUrl) : 1;
        }
        
        // Store raw response if requested
        if (testOptions.includeRawResponse) {
          try {
            const clonedResponse = response.clone();
            const rawText = await clonedResponse.text();
            result.rawResponse = rawText.length > 10000 ? 
              `${rawText.substring(0, 10000)}... [truncated, total length: ${rawText.length}]` : 
              rawText;
          } catch (e) {
            result.debugInfo.rawResponseError = String(e);
          }
        }
        
        // Special handling for common error status codes
        if (response.status === 405) { // Method Not Allowed
          result.message = `Method ${testOptions.method} not allowed for this endpoint`;
          if (result.httpDetails.allowedMethods && result.httpDetails.allowedMethods.length > 0) {
            result.message += `. Allowed methods: ${result.httpDetails.allowedMethods.join(', ')}`;
          }
          result.status = "error";
        } 
        else if (response.status === 400) { // Bad Request
          try {
            const responseData = await response.json();
            result.message = "Bad Request: Parameter validation failed";
            
            // Extract parameter validation errors from response
            if (responseData.errors) {
              if (Array.isArray(responseData.errors)) {
                // Handle array of errors
                for (const error of responseData.errors) {
                  if (error.param || error.field) {
                    result.parameterValidation.invalidParameters.push({
                      name: error.param || error.field,
                      error: error.message || error.msg || "Invalid value",
                      expectedType: error.type || null,
                      providedValue: error.value ? String(error.value) : null,
                    });
                  }
                }
              } else if (typeof responseData.errors === 'object') {
                // Handle object of errors
                for (const [field, message] of Object.entries(responseData.errors)) {
                  result.parameterValidation.invalidParameters.push({
                    name: field,
                    error: String(message),
                    expectedType: null,
                    providedValue: null,
                  });
                }
              }
            } else if (responseData.message && typeof responseData.message === 'string') {
              // Look for parameter names in the error message
              const paramMatches = responseData.message.match(/['"]([^'"]+)['"]/g);
              if (paramMatches) {
                for (const match of paramMatches) {
                  const param = match.replace(/['"]/g, '');
                  result.parameterValidation.missingParameters.push(param);
                }
              }
              result.message = `Bad Request: ${responseData.message}`;
            }
            
            result.status = "error";
            result.debugInfo.validationResponse = responseData;
          } catch (e) {
            // Non-JSON response for 400
            try {
              const textResponse = await response.text();
              result.message = `Bad Request: ${textResponse.substring(0, 100)}${textResponse.length > 100 ? '...' : ''}`;
            } catch {
              result.message = "Bad Request: Parameter validation failed";
            }
            result.status = "error";
          }
        } 
        else if (response.status === 401 || response.status === 403) {
          result.message = response.status === 401 ? 
            "Authentication required" : "Authorization failed";
          result.status = "error";
        } 
        else if (response.status === 404) {
          result.message = "Endpoint not found";
          result.status = "error";
        } 
        else if (response.status === 429) {
          result.message = "Rate limit exceeded";
          const retryAfter = responseHeaders['retry-after'];
          if (retryAfter) {
            result.message += `, retry after ${retryAfter} seconds`;
          }
          result.status = "error";
        } 
        else if (response.status >= 500) {
          result.message = `Server error: ${response.status} ${response.statusText}`;
          result.status = "error";
        } 
        else if (response.status >= 200 && response.status < 300) {
          // Success case
          result.message = `Connection successful: ${response.status} ${response.statusText}`;
          result.status = "success";
          
          // Validate content type if expected
          if (testOptions.expectedContentType && contentType &&
              !contentType.includes(testOptions.expectedContentType)) {
            result.message += ` (Warning: Content-Type mismatch, expected ${testOptions.expectedContentType}, got ${contentType})`;
            result.status = "partial_success";
          }
          
          // Validate allowed status codes
          if (!testOptions.allowedStatusCodes?.includes(response.status)) {
            result.message += ` (Warning: Status code ${response.status} not in allowed list: ${testOptions.allowedStatusCodes?.join(', ')})`;
            result.status = "partial_success";
          }
        } 
        else if (response.status >= 300 && response.status < 400) {
          result.message = `Redirect detected: ${response.status} ${response.statusText}`;
          result.status = testOptions.followRedirects ? "success" : "partial_success";
        }
        else {
          result.message = `Unexpected status code: ${response.status} ${response.statusText}`;
          result.status = "partial_success";
        }
        
        // Record final metrics
        metrics.endTime = Date.now();
        result.requestMetrics.totalResponseTimeMs = metrics.endTime - metrics.startTime;
        result.requestMetrics.connectionEstablishmentTimeMs = 
          metrics.connectionEndTime - metrics.connectionStartTime;
        
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
    
    // Log retry attempt if verbose
    if (testOptions.verboseLogging) {
      console.log(`Attempt ${attempts}/${testOptions.maxRetries! + 1} failed: ${result.message}`);
    }
    
    // Wait before retry
    if (attempts <= testOptions.maxRetries!) {
      await new Promise(resolve => setTimeout(resolve, testOptions.retryDelay));
    }
  }
  
  // All retries exhausted
  metrics.endTime = Date.now();
  result.requestMetrics.totalResponseTimeMs = metrics.endTime - metrics.startTime;
  result.message = `Connection failed after ${attempts} attempts: ${result.message}`;
  
  return result;
}

/**
 * Check CORS headers for compliance with expected origin
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
 * Parse the number of redirects by comparing original and final URLs
 */
function parseRedirectCount(finalUrl: string, originalUrl: string): number {
  try {
    // Simple estimation - if URLs differ, assume at least one redirect
    return finalUrl !== originalUrl ? 1 : 0;
  } catch {
    return 0;
  }
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
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    413: 'Payload Too Large',
    414: 'URI Too Long',
    415: 'Unsupported Media Type',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };
  return statusTexts[status] || 'Unknown Status';
}

// API Routes

/**
 * Main endpoint test route handler
 */
export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) {
    return NextResponse.json(
      { status: "error", message: "Unauthorized", timestamp: new Date().toISOString() },
      { status: 401 }
    );
  }

  const searchParams = req.nextUrl.searchParams;
  const endpoint = searchParams.get("endpoint");

  if (!endpoint) {
    return NextResponse.json(
      {
        status: "error",
        message: "Missing endpoint parameter",
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // Construct target URL with base URL if needed
  const targetUrl = endpoint.startsWith('http') ?
    endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  if (!isAllowedTargetUrl(targetUrl)) {
    return NextResponse.json(
      {
        status: "error",
        message: "Target host is not in the allowed list for this diagnostic tool",
        timestamp: new Date().toISOString(),
      },
      { status: 403 }
    );
  }

  // Parse options from query parameters
  const options: EndpointTestOptions = {
    timeout: searchParams.get("timeout") ? 
      parseInt(searchParams.get("timeout")!) : DEFAULT_OPTIONS.timeout,
    maxRetries: searchParams.get("maxRetries") ? 
      parseInt(searchParams.get("maxRetries")!) : DEFAULT_OPTIONS.maxRetries,
    method: (searchParams.get("method") as EndpointTestOptions["method"]) || DEFAULT_OPTIONS.method,
    followRedirects: searchParams.get("followRedirects") !== "false",
    validateTLS: searchParams.get("validateTLS") !== "false",
    checkCORS: searchParams.get("checkCORS") !== "false",
    includeRawResponse: searchParams.get("includeRawResponse") === "true",
    verboseLogging: searchParams.get("verbose") === "true",
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
    const result = await testApiEndpoint(targetUrl, options);
    console.log(targetUrl);
    console.log(result);
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
  } catch (error: any) {
    // Handle unexpected errors in the route handler
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
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) {
    return NextResponse.json(
      { status: "error", message: "Unauthorized", timestamp: new Date().toISOString() },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { endpoints = [] } = body;

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
    const globalOptions: EndpointTestOptions = {};
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

    // Reject any target host outside the allow-list (SSRF guard)
    const disallowedEndpoints = testsToRun.filter(ep => !isAllowedTargetUrl(ep.url!));
    if (disallowedEndpoints.length > 0) {
      return NextResponse.json(
        {
          status: "error",
          message: `Target host not allowed for: ${disallowedEndpoints.map(e => e.name).join(', ')}`,
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    // Run all tests concurrently
    const testResults = await Promise.all(
      testsToRun.map(async ({ name, url, options }) => ({
        name,
        url,
        result: await testApiEndpoint(url!, options),
      }))
    );
    
    // Calculate summary statistics
    const successCount = testResults.filter(r => r.result.status === "success").length;
    const partialCount = testResults.filter(r => r.result.status === "partial_success").length;
    const failureCount = testResults.filter(r => r.result.status === "error").length;
    
    const overallSuccess = failureCount === 0;
    
    return NextResponse.json(
      {
        status: overallSuccess ? 
          (partialCount > 0 ? "partial_success" : "success") : "error",
        timestamp: new Date().toISOString(),
        summary: {
          total: testResults.length,
          successful: successCount,
          partial: partialCount,
          failed: failureCount,
        },
        results: testResults,
      },
      {
        status: overallSuccess ? (partialCount > 0 ? 207 : 200) : 500,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
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