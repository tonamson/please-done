/**
 * React useState fixture - Form status state machine
 * Demonstrates useState pattern for form submission workflow
 */

import React, { useState, useCallback } from 'react';

/**
 * Form component with useState-based state machine
 * States: 'idle' | 'submitting' | 'success' | 'error'
 */
export function ContactForm() {
  const [status, setStatus] = useState('idle');
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = useCallback((field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Transition: idle -> submitting
    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Transition: submitting -> success
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      // Transition: submitting -> error
      setStatus('error');
      setErrorMessage(error.message);
    }
  }, [formData]);

  const handleReset = useCallback(() => {
    // Transition: success/error -> idle
    setStatus('idle');
    setErrorMessage('');
    setFormData({ name: '', email: '', message: '' });
  }, []);

  const handleRetry = useCallback(() => {
    // Transition: error -> idle (allows resubmission)
    setStatus('idle');
    setErrorMessage('');
  }, []);

  // State machine visualization:
  // idle --(submit)--> submitting --(success)--> success --(reset)--> idle
  //                       |
  //                       +--(error)--> error --(retry)--> idle
  //                                  +--(reset)--> idle

  return (
    <form onSubmit={handleSubmit}>
      {status === 'idle' && (
        <>
          <input
            type="text"
            value={formData.name}
            onChange={handleInputChange('name')}
            placeholder="Name"
          />
          <input
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            placeholder="Email"
          />
          <textarea
            value={formData.message}
            onChange={handleInputChange('message')}
            placeholder="Message"
          />
          <button type="submit">Submit</button>
        </>
      )}

      {status === 'submitting' && (
        <div>Submitting...</div>
      )}

      {status === 'success' && (
        <>
          <div>Thank you for your submission!</div>
          <button onClick={handleReset}>Send another message</button>
        </>
      )}

      {status === 'error' && (
        <>
          <div>Error: {errorMessage}</div>
          <button onClick={handleRetry}>Retry</button>
          <button onClick={handleReset}>Cancel</button>
        </>
      )}
    </form>
  );
}

export default ContactForm;
