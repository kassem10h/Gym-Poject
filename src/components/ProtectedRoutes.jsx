import { useEffect, useState } from "react";
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { HashLoader } from "react-spinners";

const API_URL = import.meta.env.VITE_REACT_APP_API;

const ProtectedRoutes = () => {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showError, setShowError] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/check-auth`, {
          withCredentials: true,
        });
        setAuthenticated(response.data.authenticated);
      } catch (error) {
        console.log("Auth check failed:", error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Delay showing error card for 2 seconds if unauthenticated
  useEffect(() => {
    if (authenticated === false) {
      const timer = setTimeout(() => {
        setShowError(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [authenticated]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
        <HashLoader
          loading={true}
          color="#36d7b7"
          size={70}
          speedMultiplier={1.5}
        />
      </div>
    );
  }
    if (!authenticated) {
    if (!showError) {
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
            <HashLoader loading={true} color="#36d7b7" size={70} speedMultiplier={1.5} />
        </div>
        );
    }
    return <Navigate to="/admin/login" replace />;
    }
    

  return <Outlet />;
};

export default ProtectedRoutes;
