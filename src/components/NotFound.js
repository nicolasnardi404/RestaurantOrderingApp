import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NotFound = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/ordini-aperti" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default NotFound;
