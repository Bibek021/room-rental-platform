// Purpose: Home page with Leaflet map to display rooms
import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// Purpose: Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const Home = () => {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Purpose: Fetch rooms from backend on component mount
    const fetchRooms = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/room`);
        setRooms(response.data);
      } catch (err) {
        setError('Failed to load rooms');
      }
    };
    fetchRooms();
  }, []);

  return (
    <div className="container">
      <h2>Room Rental Platform</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ height: '500px', width: '100%' }}>
        <MapContainer center={[40.712776, -74.005974]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {rooms.map(room => (
            room.location && room.location.coordinates && (
              <Marker key={room._id} position={[room.location.coordinates[1], room.location.coordinates[0]]}>
                <Popup>
                  <b>{room.title}</b><br />
                  {room.description}<br />
                  Price: Rs {room.price}<br />
                  Address: {room.address}
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default Home;