// region imports
// utils
import {
  RESPONSE_STATUS,
  sendResponse,
  STATUS_CODE,
} from "../../utils/index.js";
import { validateObjectId } from "../../validations/helpers/typeValidations.js";

// model
import { deleteActivityLog, getActivityLogs } from "../../queries/index.js";
// endregion

// region fetch activity logs
const fetchActivityLogs = async (req = {}, res = {}, next = () => {}) => {
  try {
    // extract query params
    const query = req?.query ?? {};

    const limit = Math.min(100, Number(query?.limit ?? 20) || 20);

    const skip =
      query?.skip !== undefined
        ? Math.max(0, Number(query?.skip ?? 0) || 0)
        : (Math.max(1, Number(query?.page ?? 1) || 1) - 1) * limit;

    const search = query?.search ?? "";

    // fetch activity logs
    const result = (await getActivityLogs(limit, skip, search)) ?? {};

    // send response
    return sendResponse(
      res,
      STATUS_CODE?.OK ?? 200,
      RESPONSE_STATUS?.SUCCESS ?? "SUCCESS",
      "Activity logs fetched successfully",
      {
        logs: result?.logs ?? [],
         filteredTotal: result?.total ?? 0,  
    overallTotal: result?.overallTotal ?? 0,
        skip: result?.skip ?? skip,
        limit: result?.limit ?? limit,
        currentPage: result?.currentPage ?? 1,
        totalPages: result?.totalPages ?? 1,
      },
    );
  } catch (err) {
    // error handling
    console.error("Error fetching activity logs:", err);
    next?.(err);
  }
};
// endregion

// region delete activity log controller
const removeActivityLog = async (req = {}, res = {}, next = () => {}) => {
  try {
    // extract params
    const { id = "" } = req?.params ?? {};

    // validate id
    const idError = validateObjectId?.(id) ?? null;
    if (idError) {
      // send response
      return sendResponse(
        res,
        STATUS_CODE?.BAD_REQUEST ?? 400,
        RESPONSE_STATUS?.FAILURE ?? "FAILURE",
        idError,
      );
    }

    // delete log
    const deleted = await deleteActivityLog?.(id);
    if (!deleted) {
      // send response
      return sendResponse(
        res,
        STATUS_CODE?.NOT_FOUND ?? 404,
        RESPONSE_STATUS?.FAILURE ?? "FAILURE",
        "Activity log not found",
      );
    }

    // send response
    return sendResponse(
      res,
      STATUS_CODE?.OK ?? 200,
      RESPONSE_STATUS?.SUCCESS ?? "SUCCESS",
      "Activity log deleted successfully",
    );
  } catch (err) {
    // error handling
    console.error("Error deleting activity log:", err);
    next?.(err);
  }
};
// endregion

// region exports
export { fetchActivityLogs, removeActivityLog };
// endregion
