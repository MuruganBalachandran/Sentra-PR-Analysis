// region imports
// models
import { ActivityLog } from "../../models/index.js";

// utils
import { toObjectId, getFormattedDateTime } from "../../utils/index.js";
// endregion

// region create activity log
const createActivityLog = async (payload = {}) => {
  try {
    // extract payload
    const {
      User_Id = null,
      Email = "",
      Action = "",
      URL = "",
      Status = 0,
      IP = "",
      Duration = "",
      Created_At = "",
      Activity = "",
    } = payload ?? {};

    // create activity log
    const activity = await ActivityLog?.create?.({
      User_Id,
      Email,
      Action,
      URL,
      Status,
      IP,
      Duration,
      Created_At,
      Activity,
    });

    return activity ?? null;
  } catch (err) {
    throw new Error(
      "Error while performing create activity log: " + (err?.message ?? ""),
    );
  }
};
// endregion

// region get activity logs
const getActivityLogs = async (limit = 10, skip = 0, search = "") => {
  try {
    // normalize params
    const safeLimit = Number(limit) || 10;
    const safeSkip = Number(skip) || 0;
    const safeSearch = search ?? "";

    // base match
    const baseMatch = { Is_Deleted: 0 };

    const searchMatch = safeSearch
      ? {
          $or: [
            { Activity: { $regex: safeSearch, $options: "i" } },
            { Email: { $regex: safeSearch, $options: "i" } },
            { Action: { $regex: safeSearch, $options: "i" } },
            { URL: { $regex: safeSearch, $options: "i" } },
          ],
        }
      : {};

    // aggregation pipeline
    const pipeline = [
      {
        $facet: {
          // logs (filtered)
          logs: [
            { $match: { ...baseMatch, ...searchMatch } },
            { $sort: { Created_At: -1 } },
            { $skip: safeSkip },
            { $limit: safeLimit },
            {
              $project: {
                _id: 0,
                Log_Id: 1,
                Activity: 1,
                Method: "$Action",
                URL: 1,
                Status: 1,
                Email: 1,
                IP: 1,
                Duration: 1,
                Created_At: 1,
              },
            },
          ],

          // filtered count
          filteredCount: [
            { $match: { ...baseMatch, ...searchMatch } },
            { $count: "count" },
          ],

          // overall count
          overallCount: [{ $match: baseMatch }, { $count: "count" }],
        },
      },
    ];

    // execute aggregation
    const result = await ActivityLog?.aggregate?.(pipeline);

    const logs = result?.[0]?.logs ?? [];
    const filteredTotal = result?.[0]?.filteredCount?.[0]?.count ?? 0;
    const overallTotal = result?.[0]?.overallCount?.[0]?.count ?? 0;

    return {
      logs,
      total: filteredTotal,
      overallTotal,
      skip: safeSkip,
      limit: safeLimit,
      currentPage: Math.floor(safeSkip / safeLimit) + 1,
      totalPages: Math.ceil(filteredTotal / safeLimit),
    };
  } catch (err) {
    throw new Error("Error fetching activity logs: " + (err?.message ?? ""));
  }
};
// endregion

// region delete activity log by id
const deleteActivityLog = async (logId = "") => {
  try {
    // validate id
    if (!logId) {
      return null;
    }

    const objectId = toObjectId?.(logId);

    // soft delete log
    const deleted = await ActivityLog?.findOneAndUpdate?.(
      { Log_Id: objectId, Is_Deleted: 0 },
      {
        $set: {
          Is_Deleted: 1,
          Updated_At: getFormattedDateTime?.(),
        },
      },
      { new: true },
    )?.lean?.();

    return deleted ?? null;
  } catch (err) {
    throw new Error(
      "Error while deleting activity log: " + (err?.message ?? ""),
    );
  }
};
// endregion

// region exports
export { createActivityLog, getActivityLogs, deleteActivityLog };
// endregion
