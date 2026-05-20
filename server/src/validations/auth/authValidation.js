// region imports
//  helpers
import {
  validateEmail,
  validatePassword,
} from "../helpers/typeValidations.js";
import { validationError } from "../helpers/validationError.js";

//  utils
import { VALIDATION_MESSAGES } from "../../utils/index.js";
// endregion


// region validate login
const validateLogin = (data = {}) => {
  //initialize errors
  const errors = [];

  //extract fields with defaults
  const { email = "", password = "" } = data || {};

  //validate email
  const emailError = validateEmail(email || "");
  if (emailError) {
    errors.push(emailError);
  }

  //validate password (only required check for login)
  const passwordError = validatePassword(password || "");
  if (
    passwordError &&
    passwordError ===
      (VALIDATION_MESSAGES?.PASSWORD_REQUIRED || "Password is required")
  ) {
    errors.push(passwordError);
  }

  //return validation error if exists
  if (errors?.length > 0) {
    return validationError(errors || []);
  }

  //return success
  return { isValid: true, error: null };
};
// endregion


// region exports
export { validateLogin };
// endregion
