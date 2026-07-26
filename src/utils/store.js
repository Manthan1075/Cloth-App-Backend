const resetPasswordData = {
  resetToken: null,
  id: null,
  expiry: null,
};

const setResetToken = ({ token, id, expiry }) => {
  resetPasswordData.resetToken = token;
  resetPasswordData.id = id;
  resetPasswordData.expiry = expiry;
};

const validateToken = (token) => {
  if (Date.now() > resetPasswordData.expiry) return false;
  return resetPasswordData.resetToken === token;
};

const getUserID = () => resetPasswordData.id;

const clearResetToken = () => {
  resetPasswordData.resetToken = null;
  resetPasswordData.id = null;
  resetPasswordData.expiry = null;
};

const otpStore = new Map();

const setOTP = ({ otp, phone, expiry }) => {
  otpStore.set(phone, { otp, expiry });
};

const validateOTP = (phone, otp) => {
  const data = otpStore.get(phone);
  if (!data) return false;
  if (Date.now() > data.expiry) {
    otpStore.delete(phone);
    return false;
  }
  return data.otp === otp;
};

const getOTP = (phone) => {
  const data = otpStore.get(phone);
  if (!data) return { otp: null, expiry: null };
  if (Date.now() > data.expiry) {
    otpStore.delete(phone);
    return { otp: null, expiry: null };
  }
  return data;
};

const clearOTP = (phone) => {
  otpStore.delete(phone);
};


export {
  setResetToken,
  validateToken,
  getUserID,
  clearResetToken,
  setOTP,
  validateOTP,
  clearOTP,
  getOTP,
};
