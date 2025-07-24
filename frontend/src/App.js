// javascript
// Purpose: Updated App component to include Profile page route, preserving existing routes.
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import EmailVerification from './pages/EmailVerification';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import CreateRequest from './pages/CreateRequest';
import ManageRequests from './pages/ManageRequests';
import RoomList from './pages/RoomList';
import RoomDetails from './pages/RoomDetails';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/" element={<RoomList />} />
          <Route path="/map" element={<Home />} />
          <Route path="/rooms/:id" element={<RoomDetails />} />
          <Route
            path="/create-room"
            element={
              <ProtectedRoute allowedRoles={['landlord']}>
                <CreateRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-request"
            element={
              <ProtectedRoute allowedRoles={['tenant']}>
                <CreateRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-requests"
            element={
              <ProtectedRoute allowedRoles={['landlord', 'admin']}>
                <ManageRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['tenant']}>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;