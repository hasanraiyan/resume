# Complete API Refactoring Guide

## Overview

This document outlines a comprehensive refactoring of the entire API codebase to implement a unified, enterprise-grade authentication and API standardization system. The refactoring affects all 192+ API routes across the application.

## Current State Analysis

### Authentication Landscape

The codebase currently has 3 distinct authentication systems:

- **NextAuth.js Credentials Provider** - Web admin panel authentication
- **Custom JWT Bearer tokens** - Mobile app authentication
- **OAuth 2.0 with PKCE** - MCP integrations

### Issues Identified

- **Inconsistent Authentication**: Different routes use different auth methods
- **No Centralized Validation**: Input validation scattered across routes
- **Inconsistent Error Handling**: Various error response formats
- **Missing Security Features**: No audit logging, rate limiting inconsistencies
- **Poor Authorization**: Basic role checks without proper middleware
- **Mixed Response Formats**: JSON responses vary across endpoints

## Goals

### Primary Objectives

1. **Unified Authentication System** - Single entry point supporting all auth strategies
2. **Standardized API Patterns** - Consistent middleware, validation, and responses
3. **Enterprise Security** - Comprehensive audit logging and rate limiting
4. **Zero Breaking Changes** - Maintain backward compatibility
5. **Improved Maintainability** - Centralized error handling and validation

### Success Criteria

- All 192+ routes refactored
- 100% test coverage for new infrastructure
- Zero authentication failures in production
- Consistent API response times
- Comprehensive audit logging

## Architecture Overview

### New System Components

#### 1. Unified Authentication Service (`src/lib/auth/`)

```
AuthService.js          - Single entry point for all auth strategies
TokenManager.js         - Consistent JWT operations
AuthorizationService.js - Role-based permission system
AuthAuditLogger.js      - Security event tracking
AuthMiddlewareFactory.js - Middleware creation utilities
TokenRefreshService.js  - Token refresh logic
```

#### 2. API Standardization Framework (`src/lib/api/`)

```
errors.js      - Custom error classes and centralized handling
validation.js  - 40+ Zod schemas for input validation
responses.js   - Standardized response utilities
middleware.js  - Complete middleware factory
index.js       - Single export point
```

#### 3. Middleware Factory Pattern

```javascript
// Route-specific middleware types
createAdminMiddleware    - Full admin access with rate limiting
createMoneyMiddleware    - Pocketly finance routes
createTasklyMiddleware   - Task management routes
createMcpMiddleware      - OAuth and MCP server routes
createPublicMiddleware   - Public routes with rate limiting
```

### Route Categories

| Category       | Routes     | Middleware               | Authentication              |
| -------------- | ---------- | ------------------------ | --------------------------- |
| Admin Routes   | 39 routes  | `createAdminMiddleware`  | Admin role required         |
| Money/Pocketly | 14 routes  | `createMoneyMiddleware`  | Flexible (admin/mobile/web) |
| Taskly         | 7 routes   | `createTasklyMiddleware` | Flexible                    |
| Public Content | 20 routes  | `createPublicMiddleware` | Optional/public             |
| MCP OAuth      | 3 routes   | `createMcpMiddleware`    | OAuth flow                  |
| Other          | 109 routes | Various                  | Route-specific              |

## Implementation Plan

### Phase 1: Infrastructure Setup (Week 1)

#### Step 1.1: Create Authentication Infrastructure

```bash
# Create auth directory structure
mkdir -p src/lib/auth
touch src/lib/auth/{AuthService.js,TokenManager.js,AuthorizationService.js,AuthAuditLogger.js,AuthMiddlewareFactory.js,TokenRefreshService.js,index.js}
```

#### Step 1.2: Create API Framework

```bash
# Create API standardization framework
mkdir -p src/lib/api
touch src/lib/api/{errors.js,validation.js,responses.js,middleware.js,index.js}
```

#### Step 1.3: Define Zod Validation Schemas

Create comprehensive validation schemas for all input types:

- User authentication schemas
- CRUD operation schemas
- File upload schemas
- Chat/message schemas
- Configuration schemas

### Phase 2: Core Implementation (Weeks 2-3)

#### Step 2.1: Implement AuthService

```javascript
// src/lib/auth/AuthService.js
export class AuthService {
  static async authenticate(request, options = {}) {
    // Unified authentication logic
    // Support Web (NextAuth), Mobile (JWT), MCP (OAuth)
  }
}
```

#### Step 2.2: Implement Middleware Factory

```javascript
// src/lib/api/middleware.js
export class ApiMiddlewareFactory {
  static createAdminMiddleware(permission, options) {
    // Admin middleware with rate limiting
  }

  static createPublicMiddleware(permission, options) {
    // Public middleware with basic rate limiting
  }
}
```

#### Step 2.3: Implement Response Standardization

```javascript
// src/lib/api/responses.js
export class ApiResponse {
  static success(data, message) {
    return { success: true, data, message };
  }

  static error(message, statusCode = 400) {
    return { success: false, error: message, statusCode };
  }
}
```

### Phase 3: Route Refactoring (Weeks 4-8)

#### Step 3.1: Create Route Migration Script

```javascript
// scripts/refactor-api-routes.js
const fs = require('fs');
const path = require('path');

function refactorRoute(routePath) {
  // Automated refactoring logic
  // - Replace auth checks with middleware
  // - Add validation schemas
  // - Standardize error handling
  // - Update response formats
}
```

#### Step 3.2: Route Categories Priority

1. **Critical Routes** - Authentication, health checks
2. **Admin Routes** - All `/api/admin/*` routes
3. **Public Routes** - Homepage, blog, contact forms
4. **App Routes** - Pocketly, Taskly, Memoscribe routes
5. **Integration Routes** - MCP, OAuth, external APIs

#### Step 3.3: Manual Refactoring Process

For each route file:

```javascript
// OLD PATTERN
import { requireAdminAuth } from '@/lib/money-auth';
import dbConnect from '@/lib/dbConnect';

export async function GET(request) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    await dbConnect();
    // route logic
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// NEW PATTERN
import { ApiMiddlewareFactory } from '@/lib/api';
import { ApiResponse } from '@/lib/api';
import dbConnect from '@/lib/dbConnect';

const handleGetData = ApiMiddlewareFactory.createAdminMiddleware('resource:get', {
  validateBody: 'resourceSchema', // optional
  handler: async (request, context, authResult, validationResult) => {
    await dbConnect();
    // route logic
    return ApiResponse.success(data, 'Data retrieved successfully');
  },
});

export const GET = handleGetData;
```

### Phase 4: Frontend Updates (Week 9)

#### Step 4.1: Update API Response Handling

Update all frontend code to handle new response format:

```javascript
// OLD: Direct data access
const data = await response.json();
setItems(data.items || []);

// NEW: Wrapped response handling
const response = await fetch('/api/items');
const result = await response.json();
if (response.ok && result.success) {
  setItems(result.data || []);
}
```

#### Step 4.2: Update Error Handling

```javascript
// OLD
if (!response.ok) {
  throw new Error('Request failed');
}

// NEW
if (!response.ok || !result.success) {
  throw new Error(result.error || 'Request failed');
}
```

### Phase 5: Testing & Validation (Weeks 10-11)

#### Step 5.1: Unit Tests

- Test all middleware factories
- Test authentication strategies
- Test validation schemas
- Test error handling

#### Step 5.2: Integration Tests

- Test complete request flows
- Test authentication scenarios
- Test rate limiting
- Test error responses

#### Step 5.3: End-to-End Tests

- Test admin panel functionality
- Test public API access
- Test mobile app integration
- Test MCP OAuth flows

### Phase 6: Deployment & Monitoring (Week 12)

#### Step 6.1: Gradual Rollout

- Deploy authentication infrastructure first
- Roll out route categories incrementally
- Monitor error rates and performance
- Rollback plan for each phase

#### Step 6.2: Production Monitoring

- Audit log analysis
- Performance monitoring
- Error rate tracking
- Security incident response

## Migration Guide

### Breaking Changes

- API response format: `{ success: true, data: ..., message: ... }`
- Authentication headers required for protected routes
- Rate limiting applied to all endpoints
- Input validation now enforced on all requests

### Backward Compatibility

- Maintain existing response structure for critical endpoints during transition
- Support both old and new authentication methods temporarily
- Gradual frontend updates to handle new response format

### Rollback Strategy

```bash
# Emergency rollback script
git reset --hard HEAD~1  # Remove last commit
git push --force-with-lease  # Force push to revert remote
# Restart services
# Monitor for restored functionality
```

## Security Considerations

### Audit Logging

- All authentication attempts logged
- Authorization decisions tracked
- Sensitive operations audited
- Log retention policies

### Rate Limiting

- Admin routes: 100 requests/minute
- Public routes: 1000 requests/minute
- Authentication routes: 10 requests/minute
- Burst protection enabled

### Input Validation

- All inputs validated with Zod schemas
- SQL injection prevention
- XSS protection
- File upload restrictions

## Performance Impact

### Expected Improvements

- 30% faster authentication checks
- 50% reduction in duplicate auth code
- Consistent response times
- Better error handling

### Monitoring Metrics

- Authentication success rate (>99.9%)
- API response time (<200ms average)
- Error rate (<1%)
- Rate limit hit rate (<5%)

## Risk Assessment

### High Risk

- Authentication system changes
- Breaking API changes for mobile apps
- Database connection issues during refactor

### Medium Risk

- Rate limiting causing legitimate request blocks
- Validation changes breaking existing integrations
- Performance degradation from middleware overhead

### Low Risk

- Response format standardization
- Error message improvements
- Code organization changes

## Success Metrics

### Technical Metrics

- ✅ All 192 routes refactored
- ✅ 100% test coverage
- ✅ Zero authentication failures
- ✅ <200ms average response time

### Business Metrics

- ✅ Admin panel fully functional
- ✅ Mobile app compatibility maintained
- ✅ MCP integrations working
- ✅ Public API access preserved

## Timeline

| Phase               | Duration | Deliverables                   |
| ------------------- | -------- | ------------------------------ |
| Infrastructure      | 1 week   | Auth system, API framework     |
| Core Implementation | 2 weeks  | Middleware factory, validation |
| Route Refactoring   | 4 weeks  | All routes migrated            |
| Frontend Updates    | 1 week   | Response handling updated      |
| Testing             | 2 weeks  | Comprehensive test suite       |
| Deployment          | 1 week   | Production rollout             |

## Team Requirements

### Skills Needed

- Node.js/Next.js expertise
- Authentication systems knowledge
- API design experience
- Security best practices
- Testing frameworks

### Resources Required

- 2 senior developers
- 1 security specialist
- 1 QA engineer
- DevOps support

## Communication Plan

### Internal Communication

- Daily standups during refactoring
- Weekly progress reports
- Risk assessment meetings
- Post-deployment review

### External Communication

- Customer communication plan for potential downtime
- Partner notification for API changes
- Mobile app user notifications

## Conclusion

This refactoring represents a significant improvement to the codebase's security, maintainability, and scalability. The unified authentication system and standardized API patterns will provide a solid foundation for future development while maintaining backward compatibility.

The phased approach minimizes risk while ensuring comprehensive coverage. Regular testing and monitoring throughout the process will ensure a successful outcome.</content>
<parameter name="filePath">PROJECT_REFACTORING.md
