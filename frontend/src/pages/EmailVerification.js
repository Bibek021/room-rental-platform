// Purpose: Email verification page for entering OTP
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const EmailVerification = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      // Purpose: Send OTP verification request to backend
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/verify-email`, {
        email,
        otp
      });
      // Purpose: Redirect to login after successful verification
      alert('Email verified successfully! Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    }
  };

  return (
    <div className="container">
      <h2>Email Verification</h2>
      <p>Enter the OTP sent to {email || 'your email'}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleVerify}>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        <button type="submit">Verify</button>
      </form>
      <p>
        Already verified? <a href="/login">Login</a>
      </p>
    </div>
  );
};

export default EmailVerification;