// javascript
// Purpose: Updated Navbar component to include Profile link for tenants, preserving existing navigation for all roles.
import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated, getUserRole, logout } from '../utils/auth';
import './Navbar.css';

const Navbar = () => {
  const isAuth = isAuthenticated();
  const role = getUserRole();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <h1 className="navbar-title">Roomfinder</h1>
      <ul style={{ display: 'flex', listStyle: 'none', justifyContent: 'space-around' }}>
        <li><Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link></li>
        {isAuth && role === 'landlord' && (
          <li><Link to="/create-room" style={{ color: 'white', textDecoration: 'none' }}>Create Room</Link></li>
        )}
        {isAuth && role === 'tenant' && (
          <>
            <li><Link to="/create-request" style={{ color: 'white', textDecoration: 'none' }}>Request Room</Link></li>
            <li><Link to="/profile" style={{ color: 'white', textDecoration: 'none' }}>Profile</Link></li>
          </>
        )}
        {isAuth && (role === 'landlord' || role === 'admin') && (
          <li><Link to="/manage-requests" style={{ color: 'white', textDecoration: 'none' }}>Manage Requests</Link></li>
        )}
        {!isAuth ? (
          <>
            <li><Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</Link></li>
            <li><Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>Register</Link></li>
          </>
        ) : (
          <li>
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
              className="logout-btn"
              aria-label="Logout of your account"
            >
              Logout
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;