// Purpose: Page for tenants to submit rental requests
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setAuthHeader } from '../utils/auth';

const CreateRequest = () => {
  const [roomId, setRoomId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Purpose: Fetch rooms for dropdown
    const fetchRooms = async () => {
      try {
        setAuthHeader();
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/room`);
        setRooms(response.data);
      } catch (err) {
        setError('Failed to load rooms');
      }
    };
    fetchRooms();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setAuthHeader();
      await axios.post(`${process.env.REACT_APP_API_URL}/request`, { roomId });
      alert('Request submitted successfully!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    }
  };

  return (
    <div className="container">
      <h2>Request Room</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          required
        >
          <option value="">Select Room</option>
          {rooms.map(room => (
            <option key={room._id} value={room._id}>{room.title} - Rs {room.price}</option>
          ))}
        </select>
        <button type="submit">Submit Request</button>
      </form>
    </div>
  );
};

export default CreateRequest;