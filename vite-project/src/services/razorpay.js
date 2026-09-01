/**
 * Razorpay Payment Integration Utility
 * Golden Food Bowl
 */

export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TWMl8a3GZGEgds';

/**
 * Dynamically load Razorpay standard checkout script if not present
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Launch Razorpay Checkout Modal
 * 
 * @param {Object} options
 * @param {number} options.amount - Amount in INR (will be converted to paise)
 * @param {string} options.orderId - System or Razorpay Order ID
 * @param {string} options.customerName - Customer full name
 * @param {string} options.customerEmail - Customer email
 * @param {string} options.customerPhone - Customer 10-digit phone
 * @param {string} options.description - Purpose / description
 * @param {Object} options.notes - Extra metadata
 * @param {Function} options.onSuccess - Callback on payment success (receives response with paymentId)
 * @param {Function} options.onFailure - Callback on payment error / failure
 * @param {Function} options.onDismiss - Callback when modal is closed
 */
export async function openRazorpayCheckout({
  amount,
  orderId,
  customerName = 'Priya Sharma',
  customerEmail = 'customer@goldenbowl.com',
  customerPhone = '9876543210',
  description = 'Golden Food Bowl Order Payment',
  notes = {},
  onSuccess,
  onFailure,
  onDismiss,
}) {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !window.Razorpay) {
    const errMsg = 'Razorpay SDK failed to load. Please check your internet connection.';
    if (onFailure) onFailure(new Error(errMsg));
    else alert(errMsg);
    return;
  }

  // Amount in paise (1 INR = 100 paise)
  const amountInPaise = Math.round(Number(amount) * 100);

  const options = {
    key: RAZORPAY_KEY_ID,
    amount: amountInPaise,
    currency: 'INR',
    name: 'Golden Food Bowl',
    description: description,
    image: 'https://res.cloudinary.com/dwmjz9csc/image/upload/v1787120716/image-removebg-preview_e1wfil.png',
    prefill: {
      name: customerName,
      email: customerEmail,
      contact: customerPhone,
    },
    notes: {
      orderId: orderId || `BWL${Date.now()}`,
      ...notes,
    },
    theme: {
      color: '#dfa500',
      backdrop_color: 'rgba(28, 25, 23, 0.7)',
    },
    modal: {
      confirm_close: true,
      ondismiss: function () {
        if (onDismiss) onDismiss();
      },
    },
    handler: function (response) {
      // response contains:
      // razorpay_payment_id
      // razorpay_order_id (if created from backend)
      // razorpay_signature (if backend order)
      if (onSuccess) {
        onSuccess({
          paymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
          amount,
          currency: 'INR',
          status: 'SUCCESSFUL',
        });
      }
    },
  };

  try {
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      console.error('Razorpay Payment Failed:', response.error);
      if (onFailure) {
        onFailure(response.error);
      } else {
        alert(`Payment failed: ${response.error?.description || 'Unknown error'}`);
      }
    });
    rzp.open();
  } catch (err) {
    console.error('Error opening Razorpay checkout:', err);
    if (onFailure) onFailure(err);
  }
}
