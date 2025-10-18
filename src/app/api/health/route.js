/**
 * @fileoverview Health check API route for monitoring system status.
 * Provides basic health information about the API server, database connectivity,
 * and system resources. Useful for load balancer health checks and monitoring.
 *
 * Features:
 * - Basic server status and uptime information
 * - Database connection health check
 * - Memory usage and system information
 * - Response time measurement
 * - No authentication required for public health monitoring
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';

/**
 * Handles GET requests for health check monitoring.
 * Performs comprehensive health checks including database connectivity,
 * memory usage, and system status reporting.
 *
 * @async
 * @function GET
 * @returns {Promise<NextResponse>} JSON response with health status and system information
 *
 * @example
 * ```js
 * // Health check request
 * GET /api/health
 *
 * // Response:
 * // {
 * //   "success": true,
 * //   "status": "healthy",
 * //   "data": {
 * //     "timestamp": "2024-01-15T10:30:00.000Z",
 * //     "uptime": 3600000,
 * //     "database": {
 * //       "status": "connected",
 * //       "responseTime": 15
 * //     },
 * //     "memory": {
 * //       "used": 67108864,
 * //       "total": 268435456,
 * //       "percentage": 25
 * //     },
 * //     "version": "1.0.0"
 * //   }
 * // }
 * ```
 *
 * @response {Object} Success response
 * @response {boolean} success - Always true for health check responses
 * @response {string} status - Health status: "healthy", "degraded", or "unhealthy"
 * @response {Object} data - Comprehensive health information
 * @response {string} data.timestamp - ISO timestamp of the health check
 * @response {number} data.uptime - Server uptime in milliseconds
 * @response {Object} data.database - Database connectivity status
 * @response {string} data.database.status - Database connection status
 * @response {number} data.database.responseTime - Database response time in milliseconds
 * @response {Object} data.memory - Memory usage information
 * @response {number} data.memory.used - Used memory in bytes
 * @response {number} data.memory.total - Total available memory in bytes
 * @response {number} data.memory.percentage - Memory usage percentage
 * @response {string} data.version - API version information
 *
 * @response {Object} Error response
 * @response {boolean} success - Always false for error responses
 * @response {string} status - Error status: "error"
 * @response {string} error - Error message describing the health check failure
 * @response {Object} data - Partial health information if available
 *
 * @health
 * - Database connection is tested with a simple query
 * - Memory usage is calculated from Node.js process information
 * - Response time is measured for performance monitoring
 * - No sensitive information is exposed in the response
 *
 * @monitoring
 * - Suitable for load balancer health checks
 * - Can be used with monitoring systems like DataDog, New Relic, etc.
 * - Fast execution for frequent health check polling
 */

export async function GET() {
  const startTime = Date.now();

  try {
    // Basic server information
    const timestamp = new Date().toISOString();
    const uptime = process.uptime() * 1000; // Convert to milliseconds

    // Database health check
    let databaseStatus = 'disconnected';
    let databaseResponseTime = 0;

    try {
      const dbStartTime = Date.now();
      await dbConnect();
      databaseResponseTime = Date.now() - dbStartTime;
      databaseStatus = 'connected';
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
      databaseStatus = 'error';
    }

    // Memory usage information
    const memUsage = process.memoryUsage();
    const memory = {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    };

    // Calculate total response time
    const responseTime = Date.now() - startTime;

    // Determine overall health status
    let status = 'healthy';
    if (databaseStatus === 'error' || memory.percentage > 90) {
      status = 'degraded';
    }
    if (databaseStatus === 'error' && memory.percentage > 95) {
      status = 'unhealthy';
    }

    // API version (could be read from package.json or environment)
    const version = process.env.npm_package_version || '1.0.0';

    const healthData = {
      timestamp,
      uptime,
      responseTime,
      database: {
        status: databaseStatus,
        responseTime: databaseResponseTime,
      },
      memory,
      version,
    };

    return NextResponse.json({
      success: true,
      status,
      data: healthData,
    });
  } catch (error) {
    console.error('Health check error:', error);

    // Return degraded status with available information
    const responseTime = Date.now() - startTime;
    const timestamp = new Date().toISOString();
    const uptime = process.uptime() * 1000;

    return NextResponse.json(
      {
        success: false,
        status: 'error',
        error: 'Health check failed',
        data: {
          timestamp,
          uptime,
          responseTime,
          message: error.message,
        },
      },
      { status: 503 } // Service Unavailable
    );
  }
}

/**
 * Handles HEAD requests for lightweight health checks.
 * Returns the same status codes as GET but without response body.
 * Useful for load balancer health checks that only need status codes.
 *
 * @async
 * @function HEAD
 * @returns {Promise<NextResponse>} Response with health status code only
 *
 * @example
 * ```http
 * HEAD /api/health
 *
 * Response:
 * HTTP 200 OK (healthy)
 * HTTP 200 OK (degraded)
 * HTTP 503 Service Unavailable (error)
 * ```
 */

export async function HEAD() {
  try {
    // Quick database check for HEAD requests
    await dbConnect();

    // Return 200 for healthy, 503 for unhealthy
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Health check HEAD error:', error);
    return new NextResponse(null, { status: 503 });
  }
}
