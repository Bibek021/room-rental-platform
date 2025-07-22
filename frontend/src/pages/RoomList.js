import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import moment from 'moment';
import { setAuthHeader } from '../utils/auth';
import './RoomList.css';

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
  const [searchLocation, setSearchLocation] = useState('');
  const [searchError, setSearchError] = useState('');
  const [mapCenter, setMapCenter] = useState([27.7172, 85.3240]); // Default: Kathmandu

  // Purpose: Fetch user role and rooms with location search
  useEffect(() => {
    const fetchData = async () => {
      try {
        setAuthHeader();
        const userResponse = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`);
        console.log('User response:', userResponse.data);
        setUserRole(userResponse.data.role);
        let endpoint = userResponse.data.role === 'landlord' ? '/room/my-rooms' : '/room';
        let params = {};

        if (userResponse.data.role !== 'landlord' && searchLocation) {
          // Purpose: Geocode place name to coordinates
          const geoResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
              q: searchLocation,
              format: 'json',
              limit: 1,
            },
            headers: {
              'User-Agent': 'RoomRentalPlatform/1.0',
            },
          });

          if (geoResponse.data.length === 0) {
            setError('No location found for the search term');
            setRooms([]);
            setSearchError('Location not found');
            return;
          }

          const { lat, lon } = geoResponse.data[0];
          endpoint = '/room/near';
          params = { lat, lng: lon, maxDistance: 10000 };
          setMapCenter([parseFloat(lat), parseFloat(lon)]);
        }

        const url = `${process.env.REACT_APP_API_URL}${endpoint}`;
        console.log('Fetching rooms from:', url, params);
        const roomsResponse = await axios.get(url, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          params,
        });
        console.log('Rooms response:', roomsResponse.data);
        setRooms(roomsResponse.data.filter(room => room.isAvailable));
        setError('');
        setSearchError('');
      } catch (err) {
        console.error('Fetch error:', err.response?.data || err.message, err);
        setError(err.response?.data?.message || 'Failed to load data');
        setSearchError(err.response?.data?.message || 'Failed to search location');
      }
    };
    fetchData();
  }, [searchLocation]);

  // Purpose: Format relative time for room creation (existing feature, unchanged)
  const formatRelativeTime = (date) => {
    return moment(date).fromNow();
  };

  // Purpose: Filter rooms by max price (existing feature, unchanged)
  const filteredRooms = maxPrice
    ? rooms.filter(room => room.price <= parseFloat(maxPrice))
    : rooms;

  // Purpose: Handle location search submission
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchLocation(e.target.elements.location.value);
  };

  // Purpose: Reset search
  const handleResetSearch = () => {
    setSearchLocation('');
    setMapCenter([27.7172, 85.3240]);
    setSearchError('');
  };

  // Purpose: Display rooms with max price filter, location search below it, clickable links, and map
  return (
    <div className="container">
      <h2 className="title">{userRole === 'landlord' ? 'My Listed Rooms' : 'Room Listings'}</h2>
      {error && <p className="error">{error}</p>}
      <div className="filters">
        <div className="filter-group">
          <input
            type="number"
            placeholder="Max Price (Rs)"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="filter-input"
          />
        </div>
        {userRole !== 'landlord' && (
          <div className="filter-group">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                name="location"
                placeholder="Enter location (e.g., Kathmandu)"
                className="search-input"
              />
              <button type="submit" className="button search-button">
                Search
              </button>
              <button type="button" onClick={handleResetSearch} className="button reset-button">
                Reset
              </button>
            </form>
            {searchError && <p className="error">{searchError}</p>}
          </div>
        )}
      </div>
      {filteredRooms.length === 0 ? (
        <p>No rooms found.</p>
      ) : (
        <ul className="room-list">
          {filteredRooms.map(room => (
            <li key={room._id} className="room-item">
              <Link to={`/rooms/${room._id}`} className="room-link">
                {room.createdAt && (
                  <span className="created-at">{formatRelativeTime(room.createdAt)}</span>
                )}
                <h3 className="room-title">{room.title}</h3>
                <p>{room.description}</p>
                <p>Price: Rs {room.price}</p>
                <p>Address: {room.location?.address || 'Address not available'}</p>
                <p>Posted by: {room.landlord?.name || 'Unknown'}</p>
                <div className="room-images">
                  {room.images && room.images.length > 0 ? (
                    room.images.map((image, index) => (
                      <img
                        key={index}
                        src={`${process.env.REACT_APP_BASE_URL}${image}`}
                        alt={`Room ${room.title} ${index + 1}`}
                        className="room-image"
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
      {filteredRooms.length > 0 && (
        <div className="map-section">
          <h3 className="map-title">Rooms on Map</h3>
          <MapContainer
            center={mapCenter}
            zoom={12}
            className="map-container"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {filteredRooms
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