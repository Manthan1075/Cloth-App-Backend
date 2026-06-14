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

export {
  setResetToken,
  validateToken,
  getUserID,
  clearResetToken,
};
