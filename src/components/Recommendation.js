// javascript
// Purpose: React component to fetch and display recommended rooms for tenants, integrating with /api/room/recommend.
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { setAuthHeader } from '../utils/auth';
import './Recommendation.css';

const Recommendation = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setAuthHeader();
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/room/recommend`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setRecommendations(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch recommendations');
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) return <div>Loading recommendations...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!recommendations.length) return <div>No recommendations available</div>;

  return (
    <div className="recommendation-container">
      <h3 className="recommendation-title">Recommended Rooms</h3>
      <div className="room-list">
        {recommendations.map((room) => (
          <Link to={`/rooms/${room._id}`} key={room._id} className="room-card">
            <img
              src={`${process.env.REACT_APP_BASE_URL}${room.images[0] || '/default-room.jpg'}`}
              alt={room.title}
              className="room-image"
              onError={(e) => console.error(`Failed to load image: ${process.env.REACT_APP_BASE_URL}${room.images[0]}`)}
            />
            <h4>{room.title}</h4>
            <p>Price: Rs {room.price}</p>
            <p>Location: {room.location.address}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Recommendation;