# Pendulum Error Handling & Validation

This BaaS implements a comprehensive error handling and validation system designed to provide consistent, secure, and developer-friendly API responses. The system follows a layered approach that catches errors early, provides meaningful feedback, and maintains security best practices.

## How Error Handling & Validation Work Together

The system uses a two-tier approach:

### Tier 1 - Route-Level Validation:
Middleware functions validate and sanitize all incoming requests before they reach controllers. This includes checking required fields, data types, formats, and applying security rules.

### Tier 2 - Business Logic Layer:
Controllers focus on executing business logic with pre-validated data, with the auth controller performing additional checks like password verification and user existence validation. Database operations and business logic can throw custom errors when operations fail.

Both tiers feed into a centralized error handler that formats responses consistently and handles logging.

## Key Benefits
- **Early Error Detection**: Issues are caught at the validation layer before affecting business logic.
- **Consistent API Responses**: All errors follow the same JSON structure for predictable client handling.
- **Enhanced Security**: Input sanitization prevents injection attacks and data corruption.
- **Developer-Friendly**: Clear error messages with specific codes help identify and resolve issues quickly.

The following sections will walk you through the specific components, error types, and practical examples to help you effectively use and extend this system.

# Error Handling Architecture

## CustomError Class

The foundation of our error handling system is the `CustomError` class, which extends JavaScript's native `Error` class with additional properties for HTTP status codes and specific error identifiers:

```typescript
export class CustomError extends Error {
  public statusCode: number;
  public errorCode?: string;

  constructor(message: string, statusCode: number = 500, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

This allows controllers and middleware to throw semantically meaningful errors that carry both HTTP status information and application-specific error codes.

## Error Creator Functions

To ensure consistency and reduce boilerplate, the system provides pre-configured error creator functions for common HTTP error scenarios:

```typescript
export const createError = {
  badRequest: (message: string = 'Bad Request', errorCode?: string) => 
    new CustomError(message, 400, errorCode),
  
  unauthorized: (message: string = 'Unauthorized', errorCode?: string) => 
    new CustomError(message, 401, errorCode),
  
  forbidden: (message: string = 'Forbidden', errorCode?: string) => 
    new CustomError(message, 403, errorCode),
  
  notFound: (message: string = 'Not Found', errorCode?: string) => 
    new CustomError(message, 404, errorCode),
  
  conflict: (message: string = 'Conflict', errorCode?: string) => 
    new CustomError(message, 409, errorCode),
  
  internal: (message: string = 'Internal Server Error', errorCode?: string) => 
    new CustomError(message, 500, errorCode)
};
```

## Global Error Handler

The centralized error handler middleware catches all errors (both custom and native) and formats them into consistent JSON responses:

```typescript
export const errorHandler = (
  err: Error | CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Determines appropriate status code and message
  // Handles different error types (CustomError, ValidationError, JWT errors, etc.)
  // Logs error details for debugging
  // Returns standardized error response
}
```

The handler also includes special logic for recognizing common error types like JWT errors, MongoDB errors, and validation errors, automatically mapping them to appropriate HTTP status codes.

## Standardized Error Response Format

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "error": {
    "message": "Collection name is required",
    "statusCode": 400,
    "errorCode": "MISSING_COLLECTION",
    "timestamp": "2024-01-15T10:30:45.123Z",
    "path": "/api/users"
  }
}
```

In development environments, a `stack` property is included for debugging. The format ensures that client applications can reliably parse error responses and handle them appropriately.

## 404 Handler

A dedicated middleware handles requests to non-existent routes:

```typescript
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new CustomError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};
```

This ensures that invalid routes return errors in the same standardized format as application errors.

# Validation System

## Two-Tier Validation Architecture

The validation system operates at two levels to ensure data integrity and security:

### Tier 1: Route-Level Validation Middleware
All requests pass through validation middleware before reaching the controllers. This middleware:
- Validates required fields and data types
- Sanitizes and normalizes input data
- Checks format constraints (MongoDB IDs, email addresses, etc.)

### Tier 2: Business Logic Layer
Controllers focus on business logic execution, with most validation already completed at the middleware layer. The auth controller performs additional checks like password verification and user existence validation.

## CRUD Validation

### Collection Name Validation
All database operations require valid collection names:

```typescript
const COLLECTION_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const COLLECTION_NAME_MAX = 30;

const isValidCollectionName = (collection: string): boolean => {
  return (
    typeof collection === 'string' &&
    collection.length > 0 &&
    collection.length <= COLLECTION_NAME_MAX &&
    COLLECTION_NAME_REGEX.test(collection)
  );
};
```

**Rules:**
- Must start with a letter
- Can contain letters, numbers, underscores, and hyphens
- Maximum 30 characters
- Cannot be empty

### MongoDB ID Validation
Object IDs are validated using MongoDB's 24-character hexadecimal format:

```typescript
const MONGODB_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const isValidMongoId = (id: string): boolean => {
  return typeof id === 'string' && MONGODB_ID_REGEX.test(id);
};
```

### Request Body Validation
Different operations have specific validation requirements:

**Insert Operations:**
- `newItems` must be a non-empty object or array of objects
- Each item in an array must be a valid object
- Objects cannot be empty

**Update Operations:**
- `updateOperation` must be a non-empty object
- For `updateSome`, a filter object is required
- Filters cannot be empty objects

**Replace Operations:**
- `newItem` must be a non-empty object
- Valid MongoDB ID required for target document

## Authentication Validation

### User Registration
Registration validation ensures data quality and security:

```typescript
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
const PASSWORD_MIN = 3;
```

**Validation Rules:**
- **Email**: Must match standard email format, automatically lowercased
- **Username**: 3-20 characters, alphanumeric with underscores/hyphens only
- **Password**: Minimum 3 characters (configurable for stronger requirements)

### User Login
Login accepts either email or username:

```typescript
export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { identifier, password } = req.body;
  
  const sanitizedIdentifier = identifier.trim().toLowerCase();
  const isEmail = sanitizedIdentifier.includes('@');
  
  if (isEmail) {
    // Validate as email
  } else {
    // Validate as username
  }
  
  req.body.isEmailLogin = isEmail;
  next();
};
```

### Token Validation
JWT tokens are validated for format and presence:

```typescript
export const validateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError.unauthorized('Authorization header must start with "Bearer "');
  }
  
  const token = authHeader.substring(7).trim();
  if (!token) {
    throw createError.unauthorized('Token is required');
  }
  
  (req as any).token = token;
  next();
};
```

## Input Sanitization

All text inputs are sanitized and normalized for data consistency:

### String Sanitization
- Trim whitespace from all string inputs
- Convert emails to lowercase
- Validate format constraints with regex patterns

### Type Coercion Safety
- Explicit type checking before operations
- Validation of array and object structures

### Filter Parameter Handling
For delete and update operations, query parameters are converted to MongoDB filter objects:

```typescript
const formatFilter = (query: Record<string, any>) => {
  const filter: Record<string, any> = {};
  
  Object.keys(query).forEach(key => {
    if (key.includes('[') && key.includes(']')) {
      // Handle operators like price[gte]=100
      const [field, operator] = key.split('[');
      const op = operator.replace(']', '');
      
      switch(op) {
        case 'gte': case 'gt': case 'lte': case 'lt':
          filter[field] = { [`$${op}`]: Number(value) };
          break;
        case 'in': case 'nin':
          filter[field] = { [`$${op}`]: value.split(',') };
          break;
      }
    }
  });
  
  return filter;
};
```

## Error Integration

Validation failures automatically trigger appropriate error responses:

```typescript
// Example validation with error throwing
if (!collection) {
  throw createError.badRequest('Collection name is required', 'MISSING_COLLECTION');
}

if (!isValidCollectionName(sanitizedCollection)) {
  throw createError.badRequest(
    'Collection name must be 1-30 chars, start with letter, alphanumeric with underscores/hyphens',
    'INVALID_COLLECTION_NAME'
  );
}
```

The validation system ensures that invalid requests never reach business logic, providing fast feedback and maintaining system security.

# Error Types & Codes

## Standard HTTP Errors

The system maps errors to standard HTTP status codes:

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid input data, missing required fields, format errors |
| 401 | Unauthorized | Authentication failures, invalid/missing tokens |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Invalid routes, non-existent resources |
| 409 | Conflict | Resource conflicts |
| 500 | Internal Server Error | Database errors, unexpected server failures |

## Custom Error Codes

The system uses specific error codes to help identify the exact cause of failures:

### CRUD Operation Errors
```
MISSING_COLLECTION                - Collection name not provided
INVALID_COLLECTION_NAME           - Collection name format invalid
MISSING_ID                        - Document ID not provided  
INVALID_ID_FORMAT                 - Invalid MongoDB ObjectId format
MISSING_UPDATE_OPERATION          - Update operation object not provided
INVALID_UPDATE_OPERATION          - Update operation is not a valid object
MISSING_NEW_ITEMS                 - Insert data not provided
INVALID_NEW_ITEMS                 - Insert data format invalid
EMPTY_NEW_ITEMS_ARRAY             - Empty array provided for insert
INVALID_ITEM_IN_ARRAY             - Invalid object in insert array
MISSING_NEW_ITEM                  - Replacement object not provided
INVALID_NEW_ITEM                  - Replacement object format invalid
MISSING_FILTER                    - Filter object not provided for some operations
INVALID_FILTER                    - Filter object format invalid
MISSING_FILTER_PARAMS             - Filter parameters missing for delete some
DELETE_ALL_CONFIRMATION_REQUIRED  - Missing confirmation for delete all
```

### Authentication Errors
```
MISSING_EMAIL               - Email not provided in registration
MISSING_PASSWORD            - Password not provided
MISSING_USERNAME            - Username not provided
INVALID_EMAIL               - Email format invalid
INVALID_PASSWORD            - Password doesn't meet requirements
INVALID_USERNAME            - Username format invalid
MISSING_IDENTIFIER          - Email/username not provided for login
MISSING_AUTH_HEADER         - Authorization header missing
INVALID_AUTH_FORMAT         - Authorization header format incorrect
MISSING_TOKEN               - JWT token not provided
INVALID_CREDENTIALS         - Login credentials incorrect
USER_CREATION_FAILED        - Database user creation failed
```

### System Errors
```
ROUTE_NOT_FOUND             - Invalid API endpoint
DATABASE_ERROR              - MongoDB operation failures
VALIDATION_ERROR            - General validation failures
INVALID_TOKEN               - JWT token validation failed
TOKEN_EXPIRED               - JWT token has expired
```

## Database Error Handling

MongoDB errors are automatically mapped to appropriate HTTP status codes:

```typescript
case 'MongoError':
case 'MongoServerError':
  statusCode = 500;
  message = 'Database error';
  errorCode = 'DATABASE_ERROR';
  break;
```

"MongoDB errors are logged server-side for debugging, clients receive a generic 'Database error' message instead of specific MongoDB error details.".

## JWT Error Handling

JSON Web Token errors are automatically handled:

```typescript
case 'JsonWebTokenError':
  statusCode = 401;
  message = 'Invalid Token';
  errorCode = 'INVALID_TOKEN';
  break;
case 'TokenExpiredError':
  statusCode = 401;
  message = 'Token expired';
  errorCode = 'TOKEN_EXPIRED';
  break;
```

## Error Response Examples

### Validation Error
```json
{
  "success": false,
  "error": {
    "message": "Collection name is required",
    "statusCode": 400,
    "errorCode": "MISSING_COLLECTION",
    "timestamp": "2024-01-15T10:30:45.123Z",
    "path": "/api/users"
  }
}
```

### Authentication Error
```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials",
    "statusCode": 401,
    "errorCode": "INVALID_CREDENTIALS",
    "timestamp": "2024-01-15T10:30:45.123Z",
    "path": "/auth/login"
  }
}
```

### Database Error
```json
{
  "success": false,
  "error": {
    "message": "Database error",
    "statusCode": 500,
    "errorCode": "DATABASE_ERROR",
    "timestamp": "2024-01-15T10:30:45.123Z",
    "path": "/api/users"
  }
}
```

### Route Not Found
```json
{
  "success": false,
  "error": {
    "message": "Route /api/invalid not found",
    "statusCode": 404,
    "errorCode": "ROUTE_NOT_FOUND",
    "timestamp": "2024-01-15T10:30:45.123Z",
    "path": "/api/invalid"
  }
}
```

## Development vs Production

In development environments, error responses include a `stack` property with the full error stack trace. This is automatically removed in production to avoid exposing internal system details.
```json
{
  "success": false,
  "error": {
    "message": "Collection name is required",
    "statusCode": 400,
    "errorCode": "MISSING_COLLECTION",
    "timestamp": "2024-01-15T10:30:45.123Z",
    "path": "/api/users"
  }
}
```
# Usage Examples

## Client-Side Error Handling

### Basic Error Response Parsing

All error responses follow the same structure, making client-side handling predictable:

```javascript
try {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collection: 'users', newItems: [{ name: 'John' }] })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    console.log('Error Code:', errorData.error.errorCode);
    console.log('Message:', errorData.error.message);
    console.log('Status:', errorData.error.statusCode);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

### Error Handling with the SDK

Using the provided BaaS SDK:

```javascript
import { BaaS } from './sdk/baas.js';

const client = new BaaS();

try {
  const result = await client.insert('users', [{ name: 'John' }]);
  console.log('Success:', result);
} catch (error) {
  if (error.response?.data?.error) {
    const { errorCode, message, statusCode } = error.response.data.error;
    
    switch (errorCode) {
      case 'MISSING_COLLECTION':
        console.error('Collection name is required');
        break;
      case 'INVALID_NEW_ITEMS':
        console.error('Invalid data format provided');
        break;
      default:
        console.error(`Error ${statusCode}: ${message}`);
    }
  }
}
```

## Error Handling Patterns

### Validation Error Recovery

```javascript
async function createUser(userData) {
  try {
    return await client.insert('users', [userData]);
  } catch (error) {
    const { errorCode } = error.response?.data?.error || {};
    
    switch (errorCode) {
      case 'INVALID_EMAIL':
        throw new Error('Please provide a valid email address');
      case 'INVALID_USERNAME':
        throw new Error('Username must be 3-20 characters, letters/numbers only');
      case 'INVALID_PASSWORD':
        throw new Error('Password must be at least 3 characters');
      default:
        throw new Error('Failed to create user');
    }
  }
}
```

### Retry Logic for Server Errors

```javascript
async function withRetry(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const statusCode = error.response?.data?.error?.statusCode;
      
      // Only retry on server errors (5xx)
      if (statusCode >= 500 && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      throw error;
    }
  }
}
```

