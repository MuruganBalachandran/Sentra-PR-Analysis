// region imports
import { mongoose, isValidObjectId } from "mongoose";
import { VALIDATION_MESSAGES, ROLE } from "../../utils/index.js";
// endregion

// region helpers
const isFalshy = (value = "") => {
  // null or undefined
  if (value === null || value === undefined) {
    return true;
  }

  // not a string
  if (typeof value !== "string") {
    return true;
  }

  // empty after trim
  if (value.trim().length === 0) {
    return true;
  }

  return false;
};
// endregion

// region validate name
const validateName = (value = "") => {
  //required check
  if (isFalshy(value)) {
    return VALIDATION_MESSAGES?.NAME_REQUIRED || "Name is required";
  }

  const name = value.trim();

  //multiple spaces
  if (/\s{2,}/.test(name)) {
    return (
      VALIDATION_MESSAGES?.NAME_SPACES ||
      "Name cannot contain multiple consecutive spaces"
    );
  }

  //leading or trailing special chars
  if (/^[-']|[-']$/.test(name)) {
    return (
      VALIDATION_MESSAGES?.NAME_SPECIAL_START ||
      "Name cannot start or end with special characters"
    );
  }

  //pattern check
  const NAME_REGEX = /^(?=.*[\p{L}\p{M}])[\p{L}\p{M}\d\s'-]+$/u;
  if (!NAME_REGEX.test(name)) {
    return (
      VALIDATION_MESSAGES?.NAME_PATTERN || "Name contains invalid characters"
    );
  }

  //word length check
  const words = name.split(/\s+/);
  if (words.some((w) => w.length < 2)) {
    return (
      VALIDATION_MESSAGES?.NAME_WORD_LENGTH ||
      "Each part of the name must be at least 2 characters"
    );
  }

  //total length
  if (name.length < 3 || name.length > 50) {
    return (
      VALIDATION_MESSAGES?.NAME_LENGTH_INVALID || "Name must be 3–50 characters"
    );
  }

  return null;
};
// endregion

// region validate email
const validateEmail = (value = "", role = "user") => {
  //required check
  if (isFalshy(value)) {
    return VALIDATION_MESSAGES?.EMAIL_REQUIRED || "Email is required";
  }

  const email = value.trim().toLowerCase();

  //max length
  if (email.length > 254) {
    return VALIDATION_MESSAGES?.EMAIL_LONG || "Email is too long";
  }

  //format check
  const emailRegex =
    /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/;

  if (!emailRegex.test(email)) {
    return VALIDATION_MESSAGES?.EMAIL_FORMAT || "Invalid email format";
  }

  return null;
};
// endregion

// region validate password
const validatePassword = (value = "", context = {}) => {
  //required check
  if (isFalshy(value)) {
    return VALIDATION_MESSAGES?.PASSWORD_REQUIRED || "Password is required";
  }

  if (typeof value !== "string") {
    return VALIDATION_MESSAGES?.PASSWORD_STRING || "Password must be a string";
  }

  const password = value || "";

  if (password.length < 8) {
    return (
      VALIDATION_MESSAGES?.PASSWORD_MIN_LENGTH ||
      "Password must be at least 8 characters"
    );
  }

  if (password.length > 128) {
    return VALIDATION_MESSAGES?.PASSWORD_MAX_LENGTH || "Password is too long";
  }

  if (!/[a-z]/.test(password)) {
    return (
      VALIDATION_MESSAGES?.PASSWORD_LOWERCASE ||
      "Password must contain a lowercase letter"
    );
  }

  if (!/[A-Z]/.test(password)) {
    return (
      VALIDATION_MESSAGES?.PASSWORD_UPPERCASE ||
      "Password must contain an uppercase letter"
    );
  }

  if (!/\d/.test(password)) {
    return (
      VALIDATION_MESSAGES?.PASSWORD_NUMBER || "Password must contain a number"
    );
  }

  if (!/[@$!%*?&#^()_+=\-[\]{}|\\:;"'<>,./]/.test(password)) {
    return (
      VALIDATION_MESSAGES?.PASSWORD_SPECIAL ||
      "Password must contain a special character"
    );
  }

  if (/(.)\1{2,}/.test(password)) {
    return (
      VALIDATION_MESSAGES?.PASSWORD_REPEAT ||
      "Password cannot contain repeated characters"
    );
  }

  return null;
};
// endregion

// region validate age
const validateAge = (value = "") => {
  if (isFalshy(value)) {
    return VALIDATION_MESSAGES?.AGE_REQUIRED || "Age is required";
  }

  let age = value;
  if (typeof value === "string") {
    age = Number(value.trim());
  }

  if (typeof age !== "number" || Number.isNaN(age)) {
    return VALIDATION_MESSAGES?.AGE_VALID || "Age must be a valid number";
  }

  if (!Number.isFinite(age)) {
    return VALIDATION_MESSAGES?.AGE_FINITE || "Age must be a finite number";
  }

  if (!Number.isInteger(age)) {
    return VALIDATION_MESSAGES?.AGE_WHOLE || "Age must be a whole number";
  }

  if (age < 18) {
    return VALIDATION_MESSAGES?.AGE_MIN || "You must be at least 18 years old";
  }

  if (age > 65) {
    return (
      VALIDATION_MESSAGES?.AGE_MAX || "Please enter a valid age (within 65)"
    );
  }

  return null;
};
// endregion

// region validate role
const validateRole = (value = "user") => {
  if (isFalshy(value)) {
    return VALIDATION_MESSAGES?.ROLE_REQUIRED || "Role is required";
  }

  if (typeof value !== "string") {
    return VALIDATION_MESSAGES?.ROLE_STRING || "Role must be a string";
  }

  const allowedRoles = [ROLE?.ADMIN, ROLE?.USER];
  if (!allowedRoles.includes(value)) {
    return VALIDATION_MESSAGES?.ROLE_INVALID || "Invalid role";
  }

  return null;
};
// endregion

// region validate department
const validateDepartment = (value = "") => {
  if (isFalshy(value)) {
    return VALIDATION_MESSAGES?.DEPARTMENT_REQUIRED || "Department is required";
  }

  if (typeof value !== "string") {
    return (
      VALIDATION_MESSAGES?.DEPARTMENT_STRING || "Department must be a string"
    );
  }

  const department = value.trim();

  // Department validation not enforced in current system

  return null;
};
// endregion

// region validate phone
const validatePhone = (value = "") => {
  if (isFalshy(value)) {
    return VALIDATION_MESSAGES?.PHONE_REQUIRED || "Phone number is required";
  }

  if (typeof value !== "string") {
    return VALIDATION_MESSAGES?.PHONE_STRING || "Phone number must be a string";
  }

  const phone = value.trim();

  if (phone.length < 7 || phone.length > 15) {
    return VALIDATION_MESSAGES?.PHONE_LENGTH || "Invalid phone number length";
  }

  const phoneRegex = /^\+?[0-9\s-]{7,15}$/;
  if (!phoneRegex.test(phone)) {
    return VALIDATION_MESSAGES?.PHONE_FORMAT || "Invalid phone format";
  }

  return null;
};
// endregion

// region validate address
const validateAddress = (value = {}) => {
  const errors = {};

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      address: VALIDATION_MESSAGES?.ADDRESS_REQUIRED || "Address is required",
    };
  }

  const { line1 = "", city = "", state = "", zipCode = "" } = value || {};

  if (isFalshy(line1)) {
    errors.line1 =
      VALIDATION_MESSAGES?.ADDRESS_LINE1_REQUIRED ||
      "Address line 1 is required";
  }

  if (isFalshy(city)) {
    errors.city = VALIDATION_MESSAGES?.CITY_REQUIRED || "City is required";
  }

  if (isFalshy(state)) {
    errors.state = VALIDATION_MESSAGES?.STATE_REQUIRED || "State is required";
  }

  if (isFalshy(zipCode)) {
    errors.zipCode =
      VALIDATION_MESSAGES?.ZIPCODE_REQUIRED || "Zip code is required";
  } else {
    const zip = zipCode.trim();
    if (!/^[0-9]{4,10}$/.test(zip)) {
      errors.zipCode =
        VALIDATION_MESSAGES?.ZIPCODE_FORMAT || "Invalid zip code";
    }
  }

  return Object.keys(errors).length ? errors : null;
};
// endregion

// region validate object id
const validateObjectId = (value = "") => {
  if (isFalshy(value)) {
    return "ID is required";
  }

  if (!isValidObjectId(value)) {
    return "Invalid object id";
  }

  return null;
};
// endregion

// region validate salary
const validateSalary = (value = "") => {
  if (isFalshy(value)) {
    return "Salary is required";
  }

  if (typeof value !== "string") {
    return VALIDATION_MESSAGES?.SALARY_STRING || "Salary must be a string";
  }

  const salary = value.trim();

  if (salary.length === 0) {
    return null;
  }

  if (!/^\d+(\.\d+)?$/.test(salary)) {
    return (
      VALIDATION_MESSAGES?.SALARY_FORMAT ||
      "Salary must be a valid non-negative number"
    );
  }

  const num = Number(salary);

  if (Number.isNaN(num)) {
    return VALIDATION_MESSAGES?.SALARY_VALID || "Salary must be a valid number";
  }

  if (!Number.isFinite(num)) {
    return (
      VALIDATION_MESSAGES?.SALARY_FINITE || "Salary must be a finite number"
    );
  }

  if (num < 0) {
    return (
      VALIDATION_MESSAGES?.SALARY_MIN || "Salary must be a non-negative number"
    );
  }

  return null;
};
// endregion

// region validate joining date
const validateJoiningDate = (value = "") => {
  if (isFalshy(value)) {
    return "Joining date is required";
  }

  if (typeof value !== "string") {
    return (
      VALIDATION_MESSAGES?.JOINING_DATE_STRING ||
      "Joining date must be a string"
    );
  }

  const dateStr = value.trim();

  if (dateStr.length === 0) {
    return null;
  }

  if (!/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return (
      VALIDATION_MESSAGES?.JOINING_DATE_FORMAT ||
      "Joining date must be in DD-MM-YYYY format"
    );
  }

  const [day, month, year] = dateStr.split("-").map(Number);

  if (year < 1900 || year > 2100) {
    return VALIDATION_MESSAGES?.JOINING_DATE_YEAR || "Joining year is invalid";
  }

  if (month < 1 || month > 12) {
    return (
      VALIDATION_MESSAGES?.JOINING_DATE_MONTH || "Joining month is invalid"
    );
  }

  const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let maxDay = monthDays[month - 1];

  if (month === 2) {
    if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
      maxDay = 29;
    }
  }

  if (day < 1 || day > maxDay) {
    return (
      VALIDATION_MESSAGES?.JOINING_DATE_INVALID ||
      "Joining day is invalid for the given month/year"
    );
  }

  return null;
};
// endregion

// region validate reporting manager
const validateReportingManager = (value = "") => {
  if (isFalshy(value)) {
    return "Reporting manager is required";
  }

  if (typeof value !== "string") {
    return (
      VALIDATION_MESSAGES?.REPORTING_MANAGER_STRING ||
      "Reporting Manager must be a string"
    );
  }

  const name = value.trim();

  if (name.length === 0) {
    return null;
  }

  if (name.length < 3 || name.length > 50) {
    return (
      VALIDATION_MESSAGES?.REPORTING_MANAGER_LENGTH ||
      "Reporting Manager must be between 3 - 50 characters"
    );
  }

  return null;
};
// endregion

// region validate employee code
const validateEmployeeCode = (value = "") => {
  if (isFalshy(value)) {
    return "Employee code is required";
  }

  if (typeof value !== "string") {
    return (
      VALIDATION_MESSAGES?.EMPLOYEE_CODE_STRING ||
      "Employee Code must be a string"
    );
  }

  const code = value.trim().toUpperCase();
  const EMP_CODE_REGEX = /^EMP\d{3,7}$/;

  if (!EMP_CODE_REGEX.test(code)) {
    return (
      VALIDATION_MESSAGES?.EMPLOYEE_CODE_FORMAT ||
      "Invalid Employee Code (format: EMP001, EMP1234)"
    );
  }

  return null;
};
// endregion

// region validate admin code
const validateAdminCode = (value = "") => {
  if (isFalshy(value)) {
    return "Admin code is required";
  }

  if (typeof value !== "string") {
    return (
      VALIDATION_MESSAGES?.ADMIN_CODE_STRING || "Admin Code must be a string"
    );
  }

  const code = value.trim().toUpperCase();
  const ADMIN_CODE_REGEX = /^ADMIN\d{2,6}$/;

  if (!ADMIN_CODE_REGEX.test(code)) {
    return (
      VALIDATION_MESSAGES?.ADMIN_CODE_FORMAT ||
      "Invalid Admin Code (format: ADMIN23, ADMIN001, ADMIN9999)"
    );
  }

  return null;
};
// endregion

// region exports
export {
  validateName,
  validateEmail,
  validatePassword,
  validateAge,
  validateRole,
  validateObjectId,
  validateDepartment,
  validatePhone,
  validateAddress,
  validateSalary,
  validateJoiningDate,
  validateReportingManager,
  validateEmployeeCode,
  validateAdminCode,
};
// endregion
