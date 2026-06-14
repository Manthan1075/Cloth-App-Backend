const buttonStyle = `
  display:inline-block;
  background:#2563eb;
  color:#ffffff;
  text-decoration:none;
  padding:12px 24px;
  border-radius:6px;
  font-weight:bold;
`;

export const orderPlacedTemplate = ({ customerName, orderId, items = [] }) => {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e5e7eb;border-radius:10px;">
      
      <h2 style="color:#16a34a;"> New Order Received</h2>

      <p>A new order has been placed.</p>

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
        style="${buttonStyle}"
      >
        View Order
      </a>

    </div>
  `;
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

export const forgetPassTemplate = ({ link }) => {
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
        href="${link}"
        style="${buttonStyle}"
      >
        Reset Password
      </a>
    </div>
  `;
};
