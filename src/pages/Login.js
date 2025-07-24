import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('tenant');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Purpose: Send login request to backend
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
        email,
        password,
        role
      });
      // Purpose: Store JWT token and redirect to home
      localStorage.setItem('token', response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="login-input"
        />
        <div className="password-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          />
          <input
            type="checkbox"
            id="show-password"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
            className="show-password-toggle"
          />
          <label htmlFor="show-password" className="show-password-label"></label>
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="login-select">
          <option value="admin">Admin</option>
          <option value="landlord">Landlord</option>
          <option value="tenant">Tenant</option>
        </select>
        <button type="submit" className="login-button">Login</button>
      </form>
      <p className="register-link">
        Don't have an account? <a href="/register">Register</a>
      </p>
    </div>
  );
};

export default Login;