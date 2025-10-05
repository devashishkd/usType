import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {user, setUser} = useContext(AuthContext);
  // Configure axios to include credentials (cookies) with requestds
  axios.defaults.withCredentials = true;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("username is required");
      return;
    }
    if (!password.trim()) {
      setError("password is required");
      return;
    }

    setLoading(true);
    try {
      const baseURL = import.meta.env.VITE_API_URL || "https://typex-jygr.onrender.com/api";
      console.log("baseURL: ", baseURL);
      const { data } = await axios.post(`${baseURL}/auth/login`, {
        username,
        password,
      });
      
      console.log(data);
      setUser(data);
      console.log("here is the user: ", data);

      navigate("/dashboard");
    
    } catch (e) {
      if (e.response) {
        
        setError(e.response.data.message || e.response.statusText);
      } else if (e.request) {
        setError("network error: unable to reach server");
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">login</h1>
        <p className="auth-subtitle">welcome back — sign in to continue</p>
        <form onSubmit={onSubmit} className="auth-form">
          <input
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            className="auth-input"
          />

          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="auth-input"
          />

          {error && (
            <div className="auth-error">{error}</div>
          )}

          <div className="auth-actions">
            <button type="submit" disabled={loading} className="btn btn-primary-auth btn-full">
              {loading ? "signing in..." : "sign in"}
            </button>

            <Link to="/signup" className="link-dim text-center">need an account?</Link>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              disabled={loading}
              className="btn btn-ghost btn-full"
            >
              continue as guest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
