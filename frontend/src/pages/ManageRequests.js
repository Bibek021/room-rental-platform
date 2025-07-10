// Purpose: Page for landlords/admins to manage rental requests
import { useState, useEffect } from 'react';
import axios from 'axios';
import { setAuthHeader } from '../utils/auth';

const ManageRequests = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Purpose: Fetch requests from backend
    const fetchRequests = async () => {
      try {
        setAuthHeader();
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/request`);
        setRequests(response.data);
      } catch (err) {
        setError('Failed to load requests');
      }
    };
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (requestId, status) => {
    try {
      setAuthHeader();
      await axios.put(`${process.env.REACT_APP_API_URL}/request/${requestId}`, { status });
      setRequests(requests.map(req =>
        req._id === requestId ? { ...req, status } : req
      ));
      alert('Request status updated!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update request');
    }
  };

  return (
    <div className="container">
      <h2>Manage Requests</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {requests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {requests.map(req => (
            <li key={req._id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
              <p>Room: {req.room?.title || 'N/A'}</p>
              <p>Tenant: {req.tenant?.email || 'N/A'}</p>
              <p>Status: {req.status}</p>
              {req.status === 'pending' && (
                <div>
                  <button
                    onClick={() => handleUpdateStatus(req._id, 'approved')}
                    style={{ marginRight: '10px' }}
                  >
                    Approve
                  </button>
                  <button onClick={() => handleUpdateStatus(req._id, 'rejected')}>
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