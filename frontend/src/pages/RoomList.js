import { useState, useEffect } from 'react';
  import axios from 'axios';
  import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
  import 'leaflet/dist/leaflet.css';
  import L from 'leaflet';
  import moment from 'moment';

  // Fix Leaflet marker icon issue
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

    // Purpose: Fetch rooms from backend
    useEffect(() => {
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

    // Purpose: Format relative time
    const formatRelativeTime = (date) => {
      return moment(date).fromNow(); // e.g., "1 min ago", "2 days ago"
    };

    const filteredRooms = maxPrice
      ? rooms.filter(room => room.price <= parseFloat(maxPrice))
      : rooms;

    return (
      <div className="container">
        <h2>Room Listings</h2>
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
                <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '12px', color: '#666' }}>
                  {formatRelativeTime(room.createdAt)}
                </span>
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
        {/* Map at the bottom */}
        {rooms.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3>Rooms on Map</h3>
            <MapContainer
              center={[27.7172, 85.3240]} // Default center: Kathmandu, Nepal
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
                    position={[room.location.coordinates[1], room.location.coordinates[0]]} // [lat, lng]
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