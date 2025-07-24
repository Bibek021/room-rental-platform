// javascript
// Purpose: Updated Profile page to redirect to home page after saving tenant preferences, using getUserRole from utils/auth.
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { setAuthHeader, getUserRole } from '../utils/auth';
import './Profile.css';

const Profile = () => {
  const [preferences, setPreferences] = useState({
    maxPrice: 1000000,
    preferredLocations: [],
    preferredCategories: [],
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const role = getUserRole();
        setUserRole(role);
        if (!role) {
          setError('Please log in to update preferences');
          return;
        }
        if (role !== 'tenant') {
          return;
        }
        setAuthHeader();
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (response.data.preferences) {
          setPreferences(response.data.preferences);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch user data');
      }
    };
    fetchPreferences();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setAuthHeader();
      await axios.put(`${process.env.REACT_APP_API_URL}/user/preferences`, preferences, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSuccess('Preferences updated successfully');
      setError(null);
      navigate('/'); // Redirect to home page after successful update
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update preferences');
      setSuccess(null);
    }
  };

  const handleLocationChange = (e) => {
    const value = e.target.value.split(',').map((loc) => loc.trim()).filter((loc) => loc);
    setPreferences({ ...preferences, preferredLocations: value });
  };

  if (!userRole) {
    return <div>Please log in to access this page</div>;
  }
  if (userRole !== 'tenant') {
    return <div>Profile preferences are only available for tenants</div>;
  }

  return (
    <div className="profile-container">
      <h2>Update Preferences</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Max Price (Rs):</label>
          <input
            type="number"
            value={preferences.maxPrice}
            onChange={(e) => setPreferences({ ...preferences, maxPrice: Number(e.target.value) })}
            className="profile-input"
          />
        </div>
        <div>
          <label>Preferred Locations (comma-separated):</label>
          <input
            type="text"
            value={preferences.preferredLocations.join(', ')}
            onChange={handleLocationChange}
            className="profile-input"
          />
        </div>
        <button type="submit" className="button">Save Preferences</button>
      </form>
    </div>
  );
};

export default Profile;