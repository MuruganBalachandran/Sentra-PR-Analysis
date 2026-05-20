// region imports
import { STATUS_CODE } from "../../utils/constants/constants.js";
// endregion

// region helper - common error response
const validationError = (errors) => ({
  isValid: false,
  error: errors,
  statusCode: STATUS_CODE.BAD_REQUEST,
});
// endregion

// region exports
export { validationError };
// endregion
