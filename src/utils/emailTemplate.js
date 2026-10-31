const buttonStyle = `
  display:inline-block;
  background:#2563eb;
  color:#ffffff;
  text-decoration:none;
  padding:12px 24px;
  border-radius:6px;
  font-weight:bold;
`;

export const orderPlacedTemplate = ({ customerName, orderId, orderNumber, items = [], totalAmount, paymentMethod }) => {
  const itemRows = items.map((item) => `<tr>
    <td style="padding:14px 10px;border-bottom:1px solid #eee;width:68px">${item.image ? `<img src="${item.image}" alt="" width="56" height="68" style="display:block;object-fit:cover;border-radius:8px"/>` : ""}</td>
    <td style="padding:14px 10px;border-bottom:1px solid #eee"><strong>${item.productName}</strong><div style="color:#777;font-size:12px;margin-top:4px">${item.variant || ""} · Qty ${item.quantity}</div></td>
    <td style="padding:14px 10px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">₹${Number(item.price || 0).toLocaleString("en-IN")}</td>
  </tr>`).join("");
  return `<div style="margin:0;background:#f7f5f1;padding:32px 12px;font-family:Arial,sans-serif;color:#25221e"><div style="max-width:620px;margin:auto;background:#fff;border:1px solid #ebe6de;border-radius:18px;overflow:hidden">
    <div style="padding:30px 32px;background:#29251f;color:#fff"><div style="font-size:12px;letter-spacing:4px;color:#d5b27c">A U R E V E</div><h1 style="font-family:Georgia,serif;font-weight:400;margin:18px 0 8px;font-size:27px">${customerName ? `Thank you, ${customerName}` : "Your order is confirmed"}</h1><div style="color:#e7e0d5;font-size:14px">We’re preparing your order with care.</div></div>
    <div style="padding:28px 32px"><div style="font-size:13px;color:#777">ORDER NUMBER</div><div style="font-size:17px;font-weight:bold;margin:5px 0 22px">${orderNumber || orderId}</div><table role="presentation" style="width:100%;border-collapse:collapse"><tbody>${itemRows}</tbody></table>
    <table role="presentation" style="width:100%;margin-top:18px;font-size:14px"><tr><td style="padding:6px 0;color:#777">Payment</td><td style="text-align:right">${paymentMethod === "RAZORPAY" ? "Paid online" : "Cash on delivery"}</td></tr><tr><td style="padding:12px 0;border-top:1px solid #ddd;font-weight:bold">Order total</td><td style="padding:12px 0;border-top:1px solid #ddd;text-align:right;font-size:18px;font-weight:bold">₹${Number(totalAmount || 0).toLocaleString("en-IN")}</td></tr></table>
    <div style="text-align:center;padding:24px 0 12px"><a href="${process.env.FRONTEND_URL}/orders/${orderId}" style="${buttonStyle};background:#a7793d;border-radius:24px">View order details</a></div></div><div style="padding:18px 32px;background:#faf9f7;color:#888;font-size:11px;text-align:center">Aureve · Thoughtfully made, beautifully yours</div></div></div>`;
};

export const adminOrderPlacedTemplate = ({ customerName, orderId, orderNumber, items = [], totalAmount, paymentMethod }) => {
  const rows = items.map((item) => `<tr><td style="padding:12px;border-bottom:1px solid #eee">${item.image ? `<img src="${item.image}" width="54" height="64" style="object-fit:cover;border-radius:7px" alt=""/>` : ""}</td><td style="padding:12px;border-bottom:1px solid #eee"><strong>${item.productName}</strong><div style="color:#777;font-size:12px">${item.variant || ""} · Qty ${item.quantity}</div></td><td style="padding:12px;text-align:right;border-bottom:1px solid #eee">₹${Number(item.price || 0).toLocaleString("en-IN")}</td></tr>`).join("");
  return `<div style="background:#f5f3ef;padding:28px;font-family:Arial,sans-serif;color:#28241f"><div style="max-width:640px;margin:auto;background:#fff;border:1px solid #e8e2d8;border-radius:16px;overflow:hidden"><div style="background:#29251f;padding:26px 30px;color:white"><div style="letter-spacing:4px;color:#d5b27c;font-size:12px">A U R E V E · ADMIN</div><h1 style="font:400 26px Georgia,serif;margin:16px 0 4px">New order received</h1><p style="color:#e7e0d5;margin:0">Order ${orderNumber || orderId} is ready for processing.</p></div><div style="padding:26px 30px"><p><b>Customer:</b> ${customerName || "Customer"}</p><p><b>Order reference:</b> ${orderNumber || orderId}</p><table style="width:100%;border-collapse:collapse"><tbody>${rows}</tbody></table><p style="margin-top:22px"><b>Payment:</b> ${paymentMethod === "RAZORPAY" ? "Online payment" : "Cash on delivery"}</p><p style="font-size:19px"><b>Order total: ₹${Number(totalAmount || 0).toLocaleString("en-IN")}</b></p><a href="${process.env.FRONTEND_URL}/admin/orders" style="${buttonStyle};background:#a7793d;border-radius:22px">Open order management</a></div></div></div>`;
};

export const orderCanceledTemplate = ({
  customerName,
  orderId,
  items = [],
}) => {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e5e7eb;border-radius:10px;">
      
      <h2 style="color:#dc2626;">Order Cancelled</h2>

      <p>An order has been cancelled.</p>

      <hr />

      <h3>Order Details</h3>

      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Order ID:</strong> ${orderId}</p>

      <p><strong>Items:</strong></p>

      <ul>
        ${items
          .map(
            (item) => `
              <li>
                ${item.productName} × ${item.quantity}
              </li>
            `,
          )
          .join("")}
      </ul>

      <p><strong>Total Items:</strong> ${items.length}</p>

      <br />

      <a
        href="${process.env.FRONTEND_URL}/admin/orders/${orderId}"
        style="${buttonStyle};background:#dc2626;"
      >
        View Order
      </a>

    </div>
  `;
};

export const forgetPassTemplate = ({ redirectUrl }) => {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e5e7eb;border-radius:10px;">
      
      <h2 style="color:#2563eb;"> Reset Password</h2>

      <p>
        We received a request to reset your password.
      </p>

      <p>
        Click the button below to create a new password.
      </p>

      <a
        href="${redirectUrl}"
        style="${buttonStyle}"
      >
        Reset Password
      </a>
    </div>
  `;
};
