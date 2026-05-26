// region Status Codes
const STATUS_CODE = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
};

const RESPONSE_STATUS = {
    SUCCESS: 'SUCCESS',
    FAILURE: 'FAILURE',
};
// endregion

// region Role Enum
const ROLE = {
    ADMIN: 'ADMIN',
    USER: 'USER',
};
// endregion

// region Validation Messages
const VALIDATION_MESSAGES = {
    // Name validation
    NAME_REQUIRED: 'Name is required',
    NAME_STRING: 'Name must be a string, not a number or other type',
    NAME_EMPTY: 'Name cannot be empty or only whitespace',
    NAME_RESERVED: 'This name is reserved and cannot be used',
    NAME_SPACES: 'Name cannot contain multiple consecutive spaces',
    NAME_SPECIAL_START: 'Name cannot start or end with hyphens or apostrophes',
    NAME_PATTERN: 'Name can contain letters, numbers, spaces, hyphens, and apostrophes, but must include at least one letter',
    NAME_WORD_LENGTH: 'Each part of the name must be at least 2 characters',
    NAME_LENGTH_INVALID: 'Name must be 3–50 characters',

    // Email validation
    EMAIL_REQUIRED: 'Email is required',
    EMAIL_STRING: 'Email must be a string, not a number or other type',
    EMAIL_EMPTY: 'Email cannot be empty or only whitespace',
    EMAIL_LONG: 'Email address is too long (max 254 characters)',
    EMAIL_FORMAT: 'Invalid email format (example: user@domain.com)',
    EMAIL_DISPOSABLE: 'Temporary or disposable email addresses are not allowed',

    // Password validation
    PASSWORD_REQUIRED: 'Password is required',
    PASSWORD_STRING: 'Password must be a string, not a number or other type',
    PASSWORD_EMPTY: 'Password cannot be empty',
    PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
    PASSWORD_MAX_LENGTH: 'Password is too long (max 128 characters)',
    PASSWORD_LOWERCASE: 'Password must contain at least one lowercase letter (a-z)',
    PASSWORD_UPPERCASE: 'Password must contain at least one uppercase letter (A-Z)',
    PASSWORD_NUMBER: 'Password must contain at least one number (0-9)',
    PASSWORD_SPECIAL: 'Password must contain at least one special character (@$!%*?&#, etc.)',
    PASSWORD_COMMON: 'This password is too common or has been found in data breaches',
    PASSWORD_REPEAT: 'Password cannot contain 3 or more repeated characters (e.g., aaa, 111)',
    PASSWORD_SEQUENCE: 'Password cannot contain sequential characters (e.g., 123, abc)',
    PASSWORD_NAME_CONTAIN: 'Password cannot contain your name',
    PASSWORD_EMAIL_CONTAIN: 'Password cannot contain your email username',
    PASSWORD_REQUIREMENTS: 'Password must be 8+ chars, with uppercase, lowercase, number, and special char',

    // Age validation
    AGE_REQUIRED: 'Age is required',
    AGE_STRING: 'Age must be a number, not a string or other type',
    AGE_VALID: 'Age must be a valid number',
    AGE_FINITE: 'Age must be a finite number',
    AGE_WHOLE: 'Age must be a whole number (no decimals)',
    AGE_MIN: 'You must be at least 13 years old to register',
    AGE_MAX: 'Please enter a valid age (maximum 120)',

    // Role validation
    ROLE_REQUIRED: 'Role is required',
    ROLE_STRING: 'Role must be a string',
    ROLE_INVALID: 'Invalid role (must be admin or user)',

    // Department validation
    DEPARTMENT_REQUIRED: 'Department is required',
    DEPARTMENT_STRING: 'Department must be a string',

    // Phone validation
    PHONE_REQUIRED: 'Phone number is required',
    PHONE_STRING: 'Phone number must be a string',
    PHONE_FORMAT: 'Invalid phone format',

    // Address validation
    ADDRESS_REQUIRED: 'Address is required',
    ADDRESS_LINE1_REQUIRED: 'Address line 1 is required',
    CITY_REQUIRED: 'City is required',
    STATE_REQUIRED: 'State is required',
    ZIPCODE_REQUIRED: 'Zip code is required',

    // JSON validation
    INVALID_JSON_PAYLOAD: 'Invalid JSON payload',

    // General validation
    NO_FIELDS_FOR_UPDATE: 'No fields provided for update',
    INVALID_FIELDS_UPDATE: 'Invalid fields for update',
};
// endregion

// region name rules

// Valid departments
 const VALID_DEPARTMENTS = [
  "HR",
  "Sales",
  "Marketing",
  "Tester",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Machine Learning",
  "Deep Learning",
  "Network",
  "Cyber Security",
  "DevOps",
  "Administration",
];
// endregion

// region exports
export {
    STATUS_CODE,
    RESPONSE_STATUS,
    ROLE,
    VALIDATION_MESSAGES,
};
// endregion


