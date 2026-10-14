import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay instance using env vars (never hardcode credentials)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * POST /api/razorpay/create-order
 * Creates a Razorpay order and returns order details to the frontend.
 * Amount must be passed in paise (e.g., ₹499 → 49900 paise).
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    // Validate amount — Razorpay minimum is 100 paise (₹1)
    if (!amount || typeof amount !== "number" || amount < 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount. Minimum order amount is ₹1 (100 paise).",
      });
    }

    const options = {
      amount: Math.round(amount), // must be an integer in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return res.status(201).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);

    // Surface Razorpay auth failures distinctly
    if (error?.statusCode === 401) {
      return res.status(401).json({
        success: false,
        message: "Razorpay authentication failed. Check your API credentials.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create payment order. Please try again.",
    });
  }
};

/**
 * POST /api/razorpay/verify-payment
 * Verifies the Razorpay payment signature using HMAC-SHA256.
 * Only marks a payment as verified if the signature is valid.
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Validate presence of all required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature.",
      });
    }

    // Generate expected signature: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(razorpay_signature, "hex")
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed. Payment not accepted.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
    });
  } catch (error) {
    console.error("Razorpay Verify Payment Error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed. Please contact support.",
    });
  }
};
