// Purpose: Page for landlords to create rooms with map and photo uploads
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { setAuthHeader } from '../utils/auth';
import 'leaflet/dist/leaflet.css';

const CreateRoom = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [position, setPosition] = useState([27.7172, 85.3240]); // Default: Kathmandu
  const navigate = useNavigate();

  // Purpose: Fetch categories for dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setAuthHeader();
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/room/category`);
        if (response.data.length === 0) {
          setError('No categories available. Please contact an admin to add categories.');
        } else {
          setCategories(response.data);
        }
      } catch (err) {
        console.error('Category fetch error:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to load categories');
      }
    };
    fetchCategories();
  }, []);

  // Purpose: Handle file input changes
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      setError('Maximum 3 images allowed');
      setImages([]);
      e.target.value = '';
    } else {
      setImages(files);
      setError('');
    }
  };

  // Purpose: Handle map clicks to place pin and reverse geocode
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        axios
          .get('https://api.opencagedata.com/geocode/v1/json', {
            params: {
              q: `${lat},${lng}`,
              key: process.env.REACT_APP_OPENCAGE_API_KEY,
              limit: 1,
            },
          })
          .then(response => {
            if (response.data.results[0]) {
              setAddress(response.data.results[0].formatted);
            } else {
              setError('Unable to fetch address for this location');
            }
          })
          .catch(err => {
            console.error('Reverse geocoding error:', err.response?.data || err.message);
            setError('Failed to fetch address');
          });
      },
    });
    return position ? <Marker position={position} /> : null;
  };

  // Purpose: Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) {
      setError('Please select a category');
      return;
    }
    if (images.length === 0) {
      setError('Please upload 1-3 images');
      return;
    }
    try {
      setAuthHeader();
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', parseFloat(price));
      formData.append('address', address);
      formData.append('category', category);
      formData.append('location', JSON.stringify({
        type: 'Point',
        coordinates: [position[1], position[0]], // [lng, lat]
      }));
      images.forEach(file => formData.append('images', file));

      await axios.post(`${process.env.REACT_APP_API_URL}/room`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Room created successfully!');
      navigate('/');
    } catch (err) {
      console.error('Room creation error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to create room');
    }
  };

  return (
    <div className="container">
      <h2>Create Room</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Price (Rs)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Address (e.g., Thamel, Kathmandu, Nepal)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
        <div style={{ height: '200px', margin: '10px 0' }}>
          <MapContainer
            center={position}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapClickHandler />
          </MapContainer>
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          required
        />
        <p>Upload 1-3 images (max 5MB each)</p>
        <button type="submit">Create Room</button>
      </form>
    </div>
  );
};

export default CreateRoom;
