import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth'; // Adjust path as needed
import LoadingSpinner from '../common/LoadingSpinner'; // Optional loading state

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Optional: Show a loading spinner while auth state is being determined
    // This might be more relevant if checking token validity async on load
     return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them back after they log in.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check roles if allowedRoles is provided
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // User is logged in but doesn't have the required role
    return <Navigate to="/unauthorized" replace />; // Redirect to an unauthorized page
  }

  // If authenticated (and authorized by role if applicable), render the child routes
  return <Outlet />;
};

export default ProtectedRoute;