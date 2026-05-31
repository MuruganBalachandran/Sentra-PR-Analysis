// region imports
// endregion

// region sendPhoneOtp — Email only (Firebase removed)
const sendPhoneOtp = async (phoneNumber, otp, fallbackEmailFn) => {
  // Firebase SMS removed - using email only
  await fallbackEmailFn();
  return { method: "email" };
};
// endregion

export { sendPhoneOtp };
