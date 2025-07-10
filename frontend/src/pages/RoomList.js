// Purpose: Page to list rooms with filters and images
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    // Purpose: Fetch rooms from backend
    const fetchRooms = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/room`);
        setRooms(response.data);
      } catch (err) {
        console.error('Room fetch error:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to load rooms');
      }
    };
    fetchRooms();
  }, []);

  const filteredRooms = maxPrice
    ? rooms.filter(room => room.price <= parseFloat(maxPrice))
    : rooms;

  return (
    <div className="container">
      <h2>Room Listings</h2>
      <Link to="/map" style={{ display: 'block', margin: '10px 0' }}>
        View Rooms on Map
      </Link>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div>
        <input
          type="number"
          placeholder="Max Price (Rs)"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>
      {filteredRooms.length === 0 ? (
        <p>No rooms found.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filteredRooms.map(room => (
            <li key={room._id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
              <h3>{room.title}</h3>
              <p>{room.description}</p>
              <p>Price: Rs {room.price}</p>
              <p>Address: {room.location?.address || 'Address not available'}</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {room.images && room.images.length > 0 ? (
                  room.images.map((image, index) => (
                    <img
                      key={index}
                      src={`${process.env.REACT_APP_BASE_URL}${image}`}
                      alt={`Room ${room.title} ${index + 1}`}
                      style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      onError={(e) => console.error(`Failed to load image: ${process.env.REACT_APP_BASE_URL}${image}`)}
                    />
                  ))
                ) : (
                  <p>No images available</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RoomList;