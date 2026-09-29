import { createTransport } from "nodemailer";
import {
  forgetPassTemplate,
  orderCanceledTemplate,
  orderPlacedTemplate,
} from "./emailTemplate.js";

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendEmail = async ({ to, subject, type, data }) => {
  try {
    let html = "";

    switch (type) {
      case "orderPlaced":
        html = orderPlacedTemplate(data);
        break;

      case "orderCancelled":
        html = orderCanceledTemplate(data);
        break;

      case "forgetPassword":
        html = forgetPassTemplate(data);
        break;

      default:
        throw new Error("Invalid email type");
    }

    const info = await transporter.sendMail({
      from: `"CK Fashion" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent → ${to} | Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error(`[Email] Failed → ${to} | ${error.message}`);

    return {
      success: false,
      message: error.message,
    };
  }
};
