// Purpose: Page for landlords and admins to manage room requests
  import { useState, useEffect } from 'react';
  import axios from 'axios';
  import { setAuthHeader } from '../utils/auth';

  const ManageRequests = () => {
    const [requests, setRequests] = useState([]);
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState('');

    // Purpose: Fetch user role and requests
    useEffect(() => {
      const fetchData = async () => {
        try {
          setAuthHeader();
          // Fetch user role from token or profile
          const profileResponse = await axios.get(`${process.env.REACT_APP_API_URL}/auth/profile`);
          setUserRole(profileResponse.data.role);

          // Fetch requests
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/request`);
          setRequests(response.data);
        } catch (err) {
          console.error('Fetch error:', err.response?.data || err.message);
          setError(err.response?.data?.message || 'Failed to load requests');
        }
      };
      fetchData();
    }, []);

    // Purpose: Handle request status update
    const handleStatusUpdate = async (requestId, status) => {
      try {
        setAuthHeader();
        await axios.put(`${process.env.REACT_APP_API_URL}/request/${requestId}`, { status });
        setRequests(requests.map(req =>
          req._id === requestId ? { ...req, status } : req
        ));
        alert(`Request ${status} successfully!`);
      } catch (err) {
        console.error('Status update error:', err.response?.data || err.message);
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
            {requests.map(request => (
              <li key={request._id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
                <p><strong>Room:</strong> {request.room?.title || 'N/A'}</p>
                <p><strong>Address:</strong> {request.room?.location?.address || 'N/A'}</p>
                <p><strong>Price:</strong> Rs {request.room?.price || 'N/A'}</p>
                <p><strong>Tenant:</strong> {request.tenant?.name || 'N/A'} ({request.tenant?.email || 'N/A'})</p>
                {userRole === 'landlord' && (
                  <p><strong>Message:</strong> {request.message || 'No message provided'}</p>
                )}
                <p><strong>Status:</strong> {request.status}</p>
                {request.status === 'pending' && (
                  <div>
                    <button
                      onClick={() => handleStatusUpdate(request._id, 'approved')}
                      style={{ marginRight: '10px' }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(request._id, 'rejected')}
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