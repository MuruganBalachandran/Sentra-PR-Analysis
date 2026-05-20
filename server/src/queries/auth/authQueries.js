// region imports
// libraries
import mongoose from "mongoose";

// models
import { User } from "../../models/index.js";
// endregion

// region find user by email
const findUserByEmail = async (email = "") => {
  try {
    // normalize email
    const safeEmail = email?.trim?.()?.toLowerCase?.() ?? "";

    // find user
    const user = await User?.findOne?.({
      Email: safeEmail,
      Is_Deleted: 0,
    })?.lean?.();

    return user ?? null;
  } catch (err) {
    throw new Error(
      "Error while finding user by email: " + (err?.message ?? ""),
    );
  }
};
// endregion

// region get user profile by User_Id (simple)
const getProfileQuery = async (userId = "") => {
  try {
    if (!userId) return null;
    const objectId = new mongoose.Types.ObjectId(userId);
    const user = await User.findOne(
      { User_Id: objectId, Is_Deleted: 0 },
      { _id: 0, User_Id: 1, Name: 1, Email: 1, Role: 1, Created_At: 1, Updated_At: 1 }
    ).lean();
    return user || null;
  } catch (err) {
    throw new Error("Error while fetching profile: " + (err?.message ?? ""));
  }
};
// endregion

// region check if email exists
const isEmailExists = async (email = "") => {
  try {
    // normalize email
    const safeEmail = email?.trim?.()?.toLowerCase?.() ?? "";
    if (!safeEmail) {
      return false;
    }

    // check email
    const user = await User?.findOne?.({
      Email: safeEmail,
      Is_Deleted: 0,
    })?.lean?.();

    return Boolean(user);
  } catch (err) {
    throw new Error(
      "Error while checking if email exists: " + (err?.message ?? ""),
    );
  }
};
// endregion

// region exports
export { findUserByEmail, getProfileQuery, isEmailExists };
// endregion
