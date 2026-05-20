  // region imports
  // package imports
  import argon2 from "argon2";
  import jwt from "jsonwebtoken";
  import chalk from "chalk";
  import moment from "moment";
  import mongoose from "mongoose";
  // local imports
  import { STATUS_CODE, RESPONSE_STATUS } from "../constants/constants.js";
  import { env } from "../../config/index.js";
  // endregion

  //--------------------------------------------------------------------

  // region argon2
  //  hash password utility
  const hashPassword = async (password = "") => {
    if (!password) {
      return "";
    }

    return (
      argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      }) || ""
    );
  };

  // verify password utility
  const verifyPassword = async (plainPassword = "", hashedPassword = "") => {
    if (!plainPassword || !hashedPassword) {
      return false;
    }

    return argon2.verify(hashedPassword, plainPassword) || false;
  };
  // endregion

  //--------------------------------------------------------------------

  // region jwt
  // generate token
  const generateToken = (payload = {}) => {
    // prevent generating token without payload
    if (!payload) {
      return "";
    }

    return (
      jwt.sign(payload, env?.JWT_SECRET || "", {
        expiresIn: "1h",
        algorithm: "HS256",
      }) || ""
    );
  };

  // verify token utility
  const verifyToken = (token = "") => {
    // ensure token exists
    if (!token) {
      return null;
    }

    return (
      jwt.verify(token, env?.JWT_SECRET || "", {
        algorithms: ["HS256"],
      }) || null
    );
  };
  // endregion

  //--------------------------------------------------------------------

  // region send response utility
  const sendResponse = (
    res,
    statusCode = STATUS_CODE?.OK || 200,
    status = RESPONSE_STATUS?.SUCCESS || "SUCCESS",
    message = "",
    payload = null,
  ) => {
    // Build response object
    const responseEnvelope = {
      statusCode,
      status,
      message,
    };

    // Include data if provided
    if (payload !== null && payload !== undefined) {
      responseEnvelope.response = payload;
    }

    // Log error responses for debugging
    if (status === RESPONSE_STATUS.FAILURE) {
      console.error(
        chalk.red(`[API ERROR - ${statusCode}]`),
        message || "Unknown error",
      );
    }

    //  Send JSON response with HTTP status
    return res.status(statusCode).json(responseEnvelope);
  };
  // endregion

  //--------------------------------------------------------------------

  // region date time formatter
  const getFormattedDateTime = () => {
    return moment().format("YYYY-MM-DD HH:mm:ss");
  };
  // endregion

  //--------------------------------------------------------------------

  // region ObjectId converter
  const toObjectId = (id = "") => {
    return id ? new mongoose.Types.ObjectId(id) : null;
  };
  // endregion

  //--------------------------------------------------------------------

  // region exports
  export {
    hashPassword,
    verifyPassword,
    generateToken,
    verifyToken,
    sendResponse,
    getFormattedDateTime,
    toObjectId,
  };
  // endregion
