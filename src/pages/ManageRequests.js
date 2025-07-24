import { useState, useEffect } from 'react';
import axios from 'axios';
import { setAuthHeader } from '../utils/auth';

const ManageRequests = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');

  // Purpose: Fetch user role and requests (existing feature, unchanged)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setAuthHeader();
        const profileResponse = await axios.get(`${process.env.REACT_APP_API_URL}/auth/profile`);
        setUserRole(profileResponse.data.role);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/request`);
        setRequests(response.data);
      } catch (err) {
        console.error('Fetch error:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to load requests');
      }
    };
    fetchData();
  }, []);

  // Purpose: Handle request acceptance, update UI, and show notifications (new feature)
  const handleAccept = async (requestId) => {
    try {
      setAuthHeader();
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/request/accept/${requestId}`);
      setRequests(requests.map(req =>
        req._id === requestId ? { ...req, status: 'approved' } :
        req.room._id === requests.find(r => r._id === requestId).room._id ? { ...req, status: 'rejected' } : req
      ));
      alert(response.data.message);
    } catch (err) {
      console.error('Accept request error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to accept request');
    }
  };

  // Purpose: Handle request rejection, update UI, and show notifications (new feature)
  const handleReject = async (requestId) => {
    try {
      setAuthHeader();
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/request/reject/${requestId}`);
      setRequests(requests.map(req => req._id === requestId ? { ...req, status: 'rejected' } : req));
      alert(response.data.message);
    } catch (err) {
      console.error('Reject request error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to reject request');
    }
  };

  // Purpose: Display requests with role-based details and accept/reject buttons (existing feature enhanced with new feature)
  return (
    <div className="container">
      <h2>Manage Requests</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {requests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {requests.map(request => (
            <li key={request._id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
              <p><strong>Room:</strong> {request.room?.title || 'N/A'}</p>
              <p><strong>Address:</strong> {request.room?.location?.address || 'N/A'}</p>
              <p><strong>Price:</strong> Rs {request.room?.price || 'N/A'}</p>
              <p><strong>Tenant:</strong> {request.tenant?.name?.trim() || 'Unknown'} ({request.tenant?.email || 'N/A'})</p>
              {userRole === 'landlord' && (
                <p><strong>Message:</strong> {request.message || 'No message provided'}</p>
              )}
              <p><strong>Status:</strong> {request.status}</p>
              {request.status === 'pending' && userRole === 'landlord' && (
                <div>
                  <button
                    onClick={() => handleAccept(request._id)}
                    style={{ marginRight: '10px' }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(request._id)}
                  >
                    Reject
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ManageRequests;