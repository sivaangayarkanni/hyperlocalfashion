import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/globals.css';
import './App.css';

import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navigation from './components/Navigation';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import UserDashboard from './pages/UserDashboard';
import TailorDashboard from './pages/TailorDashboard';
import CreateBooking from './pages/CreateBooking';
import BookingDetails from './pages/BookingDetails';
import TailorProfile from './pages/TailorProfile';
import TailorOwnProfile from './pages/TailorOwnProfile';
import NearbyTailors from './pages/NearbyTailors';
import FeaturesDemo from './pages/FeaturesDemo';
import AdvancedAIChatbot from './components/AdvancedAIChatbot';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/demo" element={<FeaturesDemo />} />
            
            {/* Specific routes BEFORE generic :id routes */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <UserDashboard />
              </PrivateRoute>
            } />
            
            <Route path="/tailor-dashboard" element={
              <PrivateRoute role="tailor">
                <TailorDashboard />
              </PrivateRoute>
            } />
            
            <Route path="/booking/new" element={
              <PrivateRoute>
                <CreateBooking />
              </PrivateRoute>
            } />
            
            <Route path="/tailors/nearby" element={
              <PrivateRoute>
                <NearbyTailors />
              </PrivateRoute>
            } />
            
            {/* Generic :id routes AFTER specific routes */}
            <Route path="/booking/:id" element={
              <PrivateRoute>
                <BookingDetails />
              </PrivateRoute>
            } />
            
            <Route path="/tailor/:id" element={<TailorProfile />} />
            <Route path="/profile" element={
              <PrivateRoute role="tailor">
                <TailorOwnProfile />
              </PrivateRoute>
            } />
          </Routes>
          
          <ToastContainer position="top-right" autoClose={3000} />
          <AdvancedAIChatbot />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
