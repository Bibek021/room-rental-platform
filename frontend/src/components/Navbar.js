import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated, getUserRole, logout } from '../utils/auth';
import './Navbar.css';

const Navbar = () => {
  const isAuth = isAuthenticated();
  const role = getUserRole();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <nav className="navbar">
      <div className="navbar-header">
        <Link to="/" className="navbar-logo">RoomRental</Link>
        <button className="hamburger" onClick={toggleMenu}>
          ☰
        </button>
      </div>
      <ul className={`navbar-links ${menuOpen ? 'active' : ''}`}>
        <li><Link to="/" onClick={toggleMenu}>Home</Link></li>
        {isAuth && role === 'landlord' && (
          <li><Link to="/create-room" onClick={toggleMenu}>Create Room</Link></li>
        )}
        {isAuth && role === 'tenant' && (
          <li><Link to="/create-request" onClick={toggleMenu}>Request Room</Link></li>
        )}
        {isAuth && (role === 'landlord' || role === 'admin') && (
          <li><Link to="/manage-requests" onClick={toggleMenu}>Manage Requests</Link></li>
        )}
        {!isAuth ? (
          <>
            <li><Link to="/login" onClick={toggleMenu}>Login</Link></li>
            <li><Link to="/register" onClick={toggleMenu}>Register</Link></li>
          </>
        ) : (
          <li>
            <button onClick={() => { toggleMenu(); handleLogout(); }} className="logout-button">
              Logout
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
