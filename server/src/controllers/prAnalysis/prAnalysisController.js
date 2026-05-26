import { sendResponse, STATUS_CODE, RESPONSE_STATUS } from "../../utils/index.js";
import { PRAnalysis, Repository } from "../../models/index.js";

const listPRAnalyses = async (req = {}, res = {}) => {
  try {
    const q = req?.query || {};
    const full = (q?.full_name || "").trim();
    const search = (q?.search || "").trim();
    const dateRange = (q?.date_range || "latest").trim();
    const limit = Math.min(100, Number(q?.limit || 20));
    const skip = Math.max(0, Number(q?.skip || 0));

    let filter = {};
    if (req.user?.role !== "ADMIN") {
      // Only filter by User_Id if it exists
      if (req.user?.User_Id) {
        filter.User_Id = req.user.User_Id;
      }
    }

    // Filter by date range
    if (dateRange && dateRange !== "latest") {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case "1d":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "1w":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "1m":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "1y":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }
      
      if (startDate) {
        // Format date to match the Created_At format (YYYY-MM-DD HH:mm:ss)
        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };
        
        filter.Created_At = { $gte: formatDate(startDate) };
      }
    }

    // Filter by full_name (owner/repo)
    if (full) {
      const repo = await Repository.findOne({ full_name: full }).lean();
      if (repo) {
        filter.Repo_Id = repo._id;
      } else {
        // No matching repo — return empty with total 0
        return sendResponse(res, STATUS_CODE?.OK || 200, RESPONSE_STATUS?.SUCCESS || "SUCCESS", "PR analyses fetched", {
          items: [],
          total: 0,
          limit,
          skip,
        });
      }
    }

    // Search across owner, repo, title
    if (search) {
      filter.$or = [
        { owner: { $regex: search, $options: "i" } },
        { repo: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { severity: { $regex: search, $options: "i" } },
      ];
    }

    // Determine sort order
    const sortOrder = dateRange === "oldest" ? 1 : -1;

    const [items, total] = await Promise.all([
      PRAnalysis.find(filter).sort({ Created_At: sortOrder }).skip(skip).limit(limit).lean(),
      PRAnalysis.countDocuments(filter),
    ]);

    return sendResponse(res, STATUS_CODE?.OK || 200, RESPONSE_STATUS?.SUCCESS || "SUCCESS", "PR analyses fetched", {
      items,
      total,
      limit,
      skip,
    });
  } catch (err) {
    return sendResponse(
      res,
      STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
      RESPONSE_STATUS?.FAILURE || "FAILURE",
      err?.message || "Failed to fetch PR analyses"
    );
  }
};

const deletePRAnalysis = async (req = {}, res = {}) => {
  try {
    const { id } = req?.params || {};
    if (!id) {
      return sendResponse(res, STATUS_CODE?.BAD_REQUEST || 400, RESPONSE_STATUS?.FAILURE || "FAILURE", "ID is required");
    }

    const analysis = await PRAnalysis.findById(id);
    if (!analysis) {
      return sendResponse(res, STATUS_CODE?.NOT_FOUND || 404, RESPONSE_STATUS?.FAILURE || "FAILURE", "PR analysis not found");
    }

    // Check authorization: user can only delete their own analyses, admins can delete any
    if (req.user?.role !== "ADMIN" && analysis.User_Id.toString() !== req.user?.User_Id) {
      return sendResponse(res, STATUS_CODE?.FORBIDDEN || 403, RESPONSE_STATUS?.FAILURE || "FAILURE", "Access denied");
    }

    await PRAnalysis.findByIdAndDelete(id);

    return sendResponse(res, STATUS_CODE?.OK || 200, RESPONSE_STATUS?.SUCCESS || "SUCCESS", "PR analysis deleted successfully");
  } catch (err) {
    return sendResponse(
      res,
      STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
      RESPONSE_STATUS?.FAILURE || "FAILURE",
      err?.message || "Failed to delete PR analysis"
    );
  }
};

export { listPRAnalyses, deletePRAnalysis };
