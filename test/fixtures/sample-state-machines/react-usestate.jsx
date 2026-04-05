import React, { useState } from 'react';

/**
 * Form component with state machine pattern
 * States: idle, submitting, success, error
 */
export function ContactForm() {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setStatus('success');
        setData({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  const handleChange = (field) => (e) => {
    setData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      {status === 'idle' && (
        <>
          <input
            type="text"
            value={data.name}
            onChange={handleChange('name')}
            placeholder="Name"
          />
          <input
            type="email"
            value={data.email}
            onChange={handleChange('email')}
            placeholder="Email"
          />
          <textarea
            value={data.message}
            onChange={handleChange('message')}
            placeholder="Message"
          />
          <button type="submit">Submit</button>
        </>
      )}
      {status === 'submitting' && <div>Loading...</div>}
      {status === 'success' && <div>Message sent successfully!</div>}
      {status === 'error' && <div>Error sending message. Please try again.</div>}
    </form>
  );
}

/**
 * Payment flow component
 * States: cart, checkout, processing, complete, failed
 */
export function PaymentFlow() {
  const [step, setStep] = useState('cart');
  const [paymentInfo, setPaymentInfo] = useState(null);

  const startCheckout = () => {
    setStep('checkout');
  };

  const processPayment = async (info) => {
    setPaymentInfo(info);
    setStep('processing');

    const result = await fetch('/api/payment', {
      method: 'POST',
      body: JSON.stringify(info)
    });

    if (result.ok) {
      setStep('complete');
    } else {
      setStep('failed');
    }
  };

  return (
    <div>
      {step === 'cart' && <button onClick={startCheckout}>Checkout</button>}
      {step === 'checkout' && (
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          processPayment(Object.fromEntries(formData));
        }}>
          <input name="cardNumber" placeholder="Card Number" />
          <input name="expiry" placeholder="MM/YY" />
          <input name="cvv" placeholder="CVV" />
          <button type="submit">Pay Now</button>
        </form>
      )}
      {step === 'processing' && <div>Processing payment...</div>}
      {step === 'complete' && <div>Payment successful!</div>}
      {step === 'failed' && <div>Payment failed. Try again.</div>}
    </div>
  );
}

/**
 * User profile editing component
 * States: view, edit, saving
 */
export function UserProfile() {
  const [mode, setMode] = useState('view');

  const enterEditMode = () => setMode('edit');
  const saveProfile = async () => {
    setMode('saving');
    await fetch('/api/profile', { method: 'PUT' });
    setMode('view');
  };

  return (
    <div>
      {mode === 'view' && (
        <>
          <div>Profile content...</div>
          <button onClick={enterEditMode}>Edit</button>
        </>
      )}
      {mode === 'edit' && (
        <>
          <input defaultValue="Current name" />
          <button onClick={saveProfile}>Save</button>
        </>
      )}
      {mode === 'saving' && <div>Saving...</div>}
    </div>
  );
}
