import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import moment from 'moment';
import { setAuthHeader } from '../utils/auth';

// Purpose: Fix Leaflet marker icon issue (existing feature, unchanged)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [userRole, setUserRole] = useState(null);

  // Purpose: Fetch user role and rooms with corrected endpoint
  useEffect(() => {
    const fetchData = async () => {
      try {
        setAuthHeader();
        const userResponse = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`);
        console.log('User response:', userResponse.data);
        setUserRole(userResponse.data.role);
        const endpoint = userResponse.data.role === 'landlord' ? '/room/my-rooms' : '/room';
        const url = `${process.env.REACT_APP_API_URL}${endpoint}`;
        console.log('Fetching rooms from:', url);
        const roomsResponse = await axios.get(url, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        console.log('Rooms response:', roomsResponse.data);
        setRooms(roomsResponse.data.filter(room => room.isAvailable));
      } catch (err) {
        console.error('Fetch error:', err.response?.data || err.message, err);
        setError(err.response?.data?.message || 'Failed to load data');
      }
    };
    fetchData();
  }, []);

  // Purpose: Format relative time for room creation (existing feature, unchanged)
  const formatRelativeTime = (date) => {
    return moment(date).fromNow();
  };

  // Purpose: Filter rooms by max price (existing feature, unchanged)
  const filteredRooms = maxPrice
    ? rooms.filter(room => room.price <= parseFloat(maxPrice))
    : rooms;

  // Purpose: Display rooms with clickable links, images, map, and price filter
  return (
    <div className="container">
      <h2>{userRole === 'landlord' ? 'My Listed Rooms' : 'Room Listings'}</h2>
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
            <li key={room._id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px', position: 'relative' }}>
              <Link to={`/rooms/${room._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                {room.createdAt && (
                  <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '12px', color: '#666' }}>
                    {formatRelativeTime(room.createdAt)}
                  </span>
                )}
                <h3>{room.title}</h3>
                <p>{room.description}</p>
                <p>Price: Rs {room.price}</p>
                <p>Address: {room.location?.address || 'Address not available'}</p>
                <p>Posted by: {room.landlord?.name || 'Unknown'}</p> {/* Purpose: Display landlord name */}
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
              </Link>
            </li>
          ))}
        </ul>
      )}
      {rooms.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Rooms on Map</h3>
          <MapContainer
            center={[27.7172, 85.3240]}
            zoom={12}
            style={{ height: '400px', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {rooms
              .filter(room => room.location?.coordinates?.length === 2)
              .map(room => (
                <Marker
                  key={room._id}
                  position={[room.location.coordinates[1], room.location.coordinates[0]]}
                >
                  <Popup>
                    <strong>{room.title}</strong><br />
                    {room.location.address}<br />
                    Rs {room.price}
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default RoomList;