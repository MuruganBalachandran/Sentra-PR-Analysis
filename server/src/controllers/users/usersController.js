import { sendResponse, STATUS_CODE, RESPONSE_STATUS } from "../../utils/index.js";
import { hashPassword } from "../../utils/index.js";
import { User } from "../../models/index.js";

const listUsers = async (req = {}, res = {}) => {
  try {
    const users = await User.find({ Is_Deleted: 0 }, { _id: 0, User_Id: 1, Name: 1, Email: 1, Role: 1, Created_At: 1 }).lean();
    return sendResponse(res, STATUS_CODE?.OK || 200, RESPONSE_STATUS?.SUCCESS || "SUCCESS", "Users fetched", users);
  } catch (err) {
    return sendResponse(res, STATUS_CODE?.INTERNAL_SERVER_ERROR || 500, RESPONSE_STATUS?.FAILURE || "FAILURE", err?.message || "Failed");
  }
};

const createUser = async (req = {}, res = {}) => {
  try {
    const { name = "", email = "", password = "", role = "USER" } = req?.body || {};
    if (!name || !email || !password) {
      return sendResponse(res, STATUS_CODE?.BAD_REQUEST || 400, RESPONSE_STATUS?.FAILURE || "FAILURE", "name, email, password required");
    }
    const existing = await User.findOne({ Email: email.toLowerCase().trim(), Is_Deleted: 0 }).lean();
    if (existing) {
      return sendResponse(res, STATUS_CODE?.CONFLICT || 409, RESPONSE_STATUS?.FAILURE || "FAILURE", "Email already exists");
    }
    const hashedPassword = await hashPassword(password);
    const user = new User({ Name: name, Email: email.toLowerCase().trim(), Password: hashedPassword, Role: role === "ADMIN" ? "ADMIN" : "USER" });
    await user.save();
    return sendResponse(res, STATUS_CODE?.CREATED || 200, RESPONSE_STATUS?.SUCCESS || "SUCCESS", "User created", { User_Id: user.User_Id, Name: user.Name, Email: user.Email, Role: user.Role });
  } catch (err) {
    return sendResponse(res, STATUS_CODE?.INTERNAL_SERVER_ERROR || 500, RESPONSE_STATUS?.FAILURE || "FAILURE", err?.message || "Failed");
  }
};

const updateUser = async (req = {}, res = {}) => {
  try {
    const id = req?.params?.id || "";
    const { name, password, role } = req?.body || {};
    if (!id) {
      return sendResponse(res, STATUS_CODE?.BAD_REQUEST || 400, RESPONSE_STATUS?.FAILURE || "FAILURE", "id required");
    }

    const { User_Id: currentUserId, Role: currentUserRole } = req.user || {};
    if (currentUserRole !== "ADMIN" && currentUserId !== id) {
      return sendResponse(res, STATUS_CODE?.FORBIDDEN || 403, RESPONSE_STATUS?.FAILURE || "FAILURE", "Access denied");
    }

    const update = {};
    if (name !== undefined) update.Name = name;
    if (password !== undefined) update.Password = password;
    if (role !== undefined && currentUserRole === "ADMIN") {
      update.Role = role === "ADMIN" ? "ADMIN" : "USER";
    }

    if (Object.keys(update).length === 0) {
      return sendResponse(res, STATUS_CODE?.BAD_REQUEST || 400, RESPONSE_STATUS?.FAILURE || "FAILURE", "No valid fields for update");
    }
    const user = await User.findOneAndUpdate({ User_Id: id, Is_Deleted: 0 }, { $set: update }, { new: true, projection: { _id: 0, User_Id: 1, Name: 1, Email: 1, Role: 1 } });
    if (!user) {
      return sendResponse(res, STATUS_CODE?.NOT_FOUND || 404, RESPONSE_STATUS?.FAILURE || "FAILURE", "User not found");
    }
    return sendResponse(res, STATUS_CODE?.OK || 200, RESPONSE_STATUS?.SUCCESS || "SUCCESS", "User updated", user);
  } catch (err) {
    return sendResponse(res, STATUS_CODE?.INTERNAL_SERVER_ERROR || 500, RESPONSE_STATUS?.FAILURE || "FAILURE", err?.message || "Failed");
  }
};

const deleteUser = async (req = {}, res = {}) => {
  try {
    const id = req?.params?.id || "";
    if (!id) {
      return sendResponse(res, STATUS_CODE?.BAD_REQUEST || 400, RESPONSE_STATUS?.FAILURE || "FAILURE", "id required");
    }
    const user = await User.findOneAndUpdate({ User_Id: id, Is_Deleted: 0 }, { $set: { Is_Deleted: 1 } }, { new: true, projection: { _id: 0, User_Id: 1 } });
    if (!user) {
      return sendResponse(res, STATUS_CODE?.NOT_FOUND || 404, RESPONSE_STATUS?.FAILURE || "FAILURE", "User not found");
    }
    return sendResponse(res, STATUS_CODE?.OK || 200, RESPONSE_STATUS?.SUCCESS || "SUCCESS", "User deleted");
  } catch (err) {
    return sendResponse(res, STATUS_CODE?.INTERNAL_SERVER_ERROR || 500, RESPONSE_STATUS?.FAILURE || "FAILURE", err?.message || "Failed");
  }
};

export { listUsers, createUser, updateUser, deleteUser };

