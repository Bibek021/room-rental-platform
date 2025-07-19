import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setAuthHeader } from '../utils/auth';

const CreateRequest = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [roomDetails, setRoomDetails] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Purpose: Fetch only available rooms for selection (existing feature enhanced with new feature)
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setAuthHeader();
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/room`);
        setRooms(response.data.filter(room => room.isAvailable));
      } catch (err) {
        console.error('Room fetch error:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to load rooms');
      }
    };
    fetchRooms();
  }, []);

  // Purpose: Fetch and display details of selected room (existing feature, unchanged)
  useEffect(() => {
    if (selectedRoom) {
      const room = rooms.find(r => r._id === selectedRoom);
      setRoomDetails(room || null);
    } else {
      setRoomDetails(null);
    }
  }, [selectedRoom, rooms]);

  // Purpose: Handle form submission (existing feature, unchanged)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom) {
      setError('Please select a room');
      return;
    }
    try {
      setAuthHeader();
      console.log('Sending request payload:', { room: selectedRoom, message });
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/request`, {
        room: selectedRoom,
        message: message || undefined
      });
      console.log('Request response:', response.data);
      alert('Request submitted successfully!');
      navigate('/');
    } catch (err) {
      console.error('Request creation error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to submit request');
    }
  };

  // Purpose: Display form with room details and images (existing feature, unchanged)
  return (
    <div className="container">
      <h2>Request Room</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          required
        >
          <option value="">Select a Room</option>
          {rooms.map(room => (
            <option key={room._id} value={room._id}>
              {room.title} - {room.location?.address || 'Address not available'} (Rs {room.price})
            </option>
          ))}
        </select>
        {roomDetails && (
          <div style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
            <h3>Room Details</h3>
            <p><strong>Title:</strong> {roomDetails.title}</p>
            <p><strong>Description:</strong> {roomDetails.description}</p>
            <p><strong>Price:</strong> Rs {roomDetails.price}</p>
            <p><strong>Address:</strong> {roomDetails.location?.address || 'N/A'}</p>
            <p><strong>Category:</strong> {roomDetails.category?.name || 'N/A'}</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {roomDetails.images && roomDetails.images.length > 0 ? (
                roomDetails.images.map((image, index) => (
                  <img
                    key={index}
                    src={`${process.env.REACT_APP_BASE_URL}${image}`}
                    alt={`Room ${roomDetails.title} ${index + 1}`}
                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                    onError={(e) => console.error(`Failed to load image: ${process.env.REACT_APP_BASE_URL}${image}`)}
                  />
                ))
              ) : (
                <p>No images available</p>
              )}
            </div>
          </div>
        )}
        <textarea
          placeholder="Optional message to landlord"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">Submit Request</button>
      </form>
    </div>
  );
};

export default CreateRequest;
