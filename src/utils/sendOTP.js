import { getOTP, validateOTP } from './store.js'


export const verifyOTP = ({ phone, otp }) => {
    try {
        const storedData = getOTP(phone);

        if (!storedData.otp) {
            return { success: false, message: "OTP expired, Please try again" };
        }

        if (!validateOTP(phone, otp)) {
            return { success: false, message: "Invalid OTP" };
        }

        return { success: true, message: "OTP verified successfully" };

    } catch (error) {
        console.error("Error verifying OTP:", error);
        return { success: false, message: "Internal Server Error, Please Try Again" };
    }
}