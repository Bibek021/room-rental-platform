import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { setAuthHeader } from '../utils/auth';
import './RoomDetails.css';

// Purpose: Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

const RoomDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  // Purpose: Fetch room details
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setAuthHeader();
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/room/${id}`);
        if (!response.data.isAvailable) {
          setError('This room is not available');
          setLoading(false);
          return;
        }
        setRoom(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Fetch room error:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to load room details');
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  // Purpose: Handle room request submission with corrected navigation
  const handleRequest = async (e) => {
    e.preventDefault();
    try {
      setAuthHeader();
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/request`,
        { room: id, message: message || undefined },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      console.log('Request response:', response.data);
      setRequestSuccess('Request submitted successfully! Redirecting to room list...');
      setRequestError('');
      setMessage('');
      setTimeout(() => {
        navigate('/', { replace: true }); // Purpose: Navigate to RoomList at root path
      }, 2000);
    } catch (err) {
      console.error('Request error:', err.response?.data || err.message);
      setRequestError(err.response?.data?.message || 'Failed to submit request');
      setRequestSuccess('');
    }
  };

  if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '20px' }}>Loading...</div>;
  if (error) return <div className="container" style={{ textAlign: 'center', marginTop: '20px', color: 'red' }}>{error}</div>;
  if (!room) return <div className="container" style={{ textAlign: 'center', marginTop: '20px' }}>Room not found</div>;

  return (
    <div className="container" style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '10px' }}>{room.title}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <p><strong>Description:</strong> {room.description}</p>
          <p><strong>Price:</strong> Rs {room.price}</p>
          <p><strong>Address:</strong> {room.location?.address || 'N/A'}</p>
          <p><strong>Category:</strong> {room.category?.name || 'N/A'}</p>
          <p><strong>Posted by:</strong> {room.landlord?.name || 'Unknown'}</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
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
        </div>
        <div>
          <form onSubmit={handleRequest} style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '10px' }}>Request This Room</h3>
            <textarea
              placeholder="Optional message to landlord"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px' }}
            />
            <button
              type="submit"
              style={{ backgroundColor: '#007bff', color: 'white', padding: '8px 16px', borderRadius: '4px' }}
            >
              Submit Request
            </button>
            {requestError && <p style={{ color: 'red', marginTop: '10px' }}>{requestError}</p>}
            {requestSuccess && <p style={{ color: 'green', marginTop: '10px' }}>{requestSuccess}</p>}
          </form>
          {room.location?.coordinates?.length === 2 && (
            <div style={{ height: '300px', width: '100%' }}>
              <MapContainer
                center={[room.location.coordinates[1], room.location.coordinates[0]]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[room.location.coordinates[1], room.location.coordinates[0]]}>
                  <Popup>
                    <strong>{room.title}</strong><br />
                    {room.location.address}
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomDetails;