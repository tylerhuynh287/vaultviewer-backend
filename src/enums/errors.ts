
export enum ErrorCodes {
    
    // General Errors
    INTERNAL_SERVER_ERROR = 500,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
  
    // Validation Errors
    VALIDATION_FAILED = 422,
  
    // Authentication Errors
    INVALID_CREDENTIALS = 1001,
    EXPIRED_TOKEN = 1002,

  
    // Database Errors
    DB_CONNECTION_FAILED = 2001,
    DB_QUERY_FAILED = 2002,
  
    // Custom Error Codes (can be expanded as needed)
    CUSTOM_ERROR = 9999
  }


  export enum GenericErrorMessages {
    MISSING_USER_ID = "Error: Missing User Id",
  }
   
  