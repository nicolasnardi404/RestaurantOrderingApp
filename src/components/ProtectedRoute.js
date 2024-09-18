import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    // User is not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.ruolo)) {
    // User doesn't have the required role, redirect to a forbidden page or home
    return <Navigate to="/forbidden" replace />;
  }

  // User is logged in and has the required role, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
