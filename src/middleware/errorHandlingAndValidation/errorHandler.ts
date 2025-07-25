import { Request, Response, NextFunction } from 'express';

export class CustomError extends Error {
  public statusCode: number;
  public errorCode?: string;

  constructor(message: string, statusCode: number = 500, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;

    // maintain stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

// common error creators for consistency
export const createError = {
  badRequest: (message: string = 'Bad Request', errorCode?: string) => {
    return new CustomError(message, 400, errorCode);
  },

  unauthorized: (message: string = 'Unauthorized', errorCode?: string) => {
    return new CustomError(message, 401, errorCode);
  },

  forbidden: (message: string = 'Forbidden', errorCode?: string) => {
    return new CustomError(message, 403, errorCode);
  },

  notFound: (message: string = 'Not Found', errorCode?: string) => {
    return new CustomError(message, 404, errorCode);
  },

  conflict: (message: string = 'Conflict', errorCode?: string) => {
    return new CustomError(message, 409, errorCode);
  },

  internal: (message: string = 'Internal Server Error', errorCode?: string) => {
    return new CustomError(message, 500, errorCode);
  },
};

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    timestamp: string;
    errorCode?: string;
    path?: string;
    stack?: string;
  };
}

// main error handling middleware
export const errorHandler = (
  err: Error | CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errorCode: string | undefined;

  if (err instanceof CustomError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode;
  } else {
    switch (err.name) {
      case 'ValidationError':
        statusCode = 400;
        message = 'Validation Error';
        errorCode = 'VALIDATION_ERROR';
        break;
      case 'CastError':
        statusCode = 400;
        message = 'Invalid ID Format';
        errorCode = 'INVALID_ID';
        break;
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
      case 'MongoError':
      case 'MongoServerError':
        statusCode = 500;
        message = 'Database error';
        errorCode = 'DATABASE_ERROR';
        break;
      default:
        break;
    }
  }

  // error logging for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(), // international standard for date/time
    statusCode,
  });

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message,
      errorCode,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
    }
  }

  // include stack trace if in development environment
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}

// 404 handler for invalid routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new CustomError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

