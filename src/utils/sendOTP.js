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




export const sendSms = async (to, message) => {
    try {
        const baseUrl = process.env.INFOBIP_BASE_URL?.replace(/\/+$/, "");
        const apiKey = process.env.INFOBIP_API_KEY;
        const sender = process.env.INFOBIP_SENDER || "ServiceSMS";

        if (!baseUrl || !apiKey) {
            throw new Error("Infobip configuration is missing");
        }

        // Normalize an Indian mobile number
        let number = String(to).trim().replace(/\D/g, "");

        // Handle 0091XXXXXXXXXX format
        if (number.startsWith("0091")) {
            number = number.slice(2);
        }

        // Handle 0XXXXXXXXXX format
        if (number.length === 11 && number.startsWith("0")) {
            number = number.slice(1);
        }

        // Add India's country code if missing
        if (number.length === 10) {
            number = `91${number}`;
        }

        // Validate the final number
        if (!/^91[6-9]\d{9}$/.test(number)) {
            throw new Error(
                "Invalid Indian mobile number. Use a valid 10-digit number."
            );
        }

        const response = await fetch(`${baseUrl}/sms/3/messages`, {
            method: "POST",
            headers: {
                Authorization: `App ${apiKey}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                messages: [
                    {
                        sender,
                        destinations: [{ to: number }],
                        content: { text: message },
                    },
                ],
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage =
                data?.requestError?.serviceException?.text ||
                data?.requestError?.serviceException?.messageId ||
                data?.message ||
                JSON.stringify(data);

            throw new Error(
                `Infobip API error (${response.status}): ${errorMessage}`
            );
        }

        const sms = data?.messages?.[0];

        // The API can accept the request while reporting a
        // delivery-related error in the message status.
        const status = sms?.status?.name;

        if (status === "REJECTED") {
            throw new Error(
                `SMS rejected: ${sms?.status?.description || status}`
            );
        }

        return {
            success: true,
            messageId: sms?.messageId,
            status,
            destination: number,
            data,
        };
    } catch (error) {
        console.error("SMS sending failed:", error.message);
        throw error;
    }
};

