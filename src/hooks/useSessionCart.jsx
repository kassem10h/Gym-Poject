import { useState, useEffect } from 'react';

// Custom Hook for Session Cart Management
const useSessionCart = () => {
  const [sessionCart, setSessionCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';
  const getToken = () => localStorage.getItem('token');

  const fetchSessionCart = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/session-cart/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSessionCart(data);
      }
    } catch (error) {
      console.error('Error fetching session cart:', error);
    }
  };

  const addToSessionCart = async (sessionId) => {
    try {
      setLoading(true);
      const token = getToken();
      
      const response = await fetch(`${API_URL}/session-cart/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id: sessionId })
      });

      const data = await response.json();

      if (response.ok) {
        await fetchSessionCart();
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error adding to session cart:', error);
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  const removeFromSessionCart = async (cartItemId) => {
    try {
      setLoading(true);
      const token = getToken();
      
      const response = await fetch(`${API_URL}/session-cart/remove/${cartItemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchSessionCart();
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error removing from session cart:', error);
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  const clearSessionCart = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      const response = await fetch(`${API_URL}/session-cart/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchSessionCart();
        return { success: true };
      }
    } catch (error) {
      console.error('Error clearing session cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionCart();
  }, []);

  return { 
    sessionCart, 
    addToSessionCart, 
    removeFromSessionCart, 
    clearSessionCart,
    loading, 
    refreshSessionCart: fetchSessionCart 
  };
};

export default useSessionCart;