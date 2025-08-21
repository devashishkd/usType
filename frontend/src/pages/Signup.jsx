import React, { useState, useContext} from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {user, setUser} = useContext(AuthContext);
  // Configure axios to include credentials (cookies) with requests
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
      const baseURL = import.meta.env.VITE_API_URL;
      const { data } = await axios.post(`${baseURL}/auth/register`, {
        username,
        password,
      });

      setUser(data);
      console.log("here is the user: ", user);
      
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
  //hello
  return (
    <div style={{
      minHeight: '68vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      backgroundColor: 'var(--bg-color)'
    }}>
      <div style={{ maxWidth: '380px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            color: 'var(--text-color)', 
            fontSize: '1.75rem', 
            fontFamily: 'var(--font-sans)',
            fontWeight: '500',
            marginBottom: '0.5rem',
            letterSpacing: '-0.01em'
          }}>
            sign up
          </h1>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <input
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1rem',
              padding: '0.875rem 1rem',
              backgroundColor: 'transparent',
              color: 'var(--text-color)',
              border: '2px solid var(--sub-color)',
              borderRadius: '0.5rem',
              outline: 'none',
              transition: 'all 0.25s ease',
              width: '100%'
            }}
            onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
            onBlur={(e) => e.target.style.borderColor = 'var(--sub-color)'}
          />

          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1rem',
              padding: '0.875rem 1rem',
              backgroundColor: 'transparent',
              color: 'var(--text-color)',
              border: '2px solid var(--sub-color)',
              borderRadius: '0.5rem',
              outline: 'none',
              transition: 'all 0.25s ease',
              width: '100%'
            }}
            onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
            onBlur={(e) => e.target.style.borderColor = 'var(--sub-color)'}
          />

          {error && (
            <div style={{
              color: 'var(--error-color)',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-sans)',
              textAlign: 'center',
              padding: '0.75rem',
              backgroundColor: 'var(--error-extra-color)',
              borderRadius: '0.5rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
              fontWeight: '500',
              padding: '0.875rem 1.5rem',
              border: '2px solid var(--sub-color)',
              borderRadius: '0.5rem',
              backgroundColor: 'transparent',
              color: 'var(--text-color)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.25s ease',
              width: '100%',
              textTransform: 'lowercase',
              letterSpacing: '0.02em',
              opacity: loading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.borderColor = '#0ea5e9';
                e.target.style.color = '#0ea5e9';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.borderColor = 'var(--sub-color)';
                e.target.style.color = 'var(--text-color)';
              }
            }}
          >
            {loading ? "creating account..." : "create account"}
          </button>

          <div style={{ 
            textAlign: 'center', 
            fontSize: '0.875rem', 
            color: 'var(--sub-color)', 
            fontFamily: 'var(--font-sans)',
            marginTop: '1rem'
          }}>
            <Link 
              to="/login" 
              style={{ 
                color: 'var(--sub-color)', 
                textDecoration: 'none',
                transition: 'color 0.25s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#0ea5e9'}
              onMouseLeave={(e) => e.target.style.color = 'var(--sub-color)'}
            >
              already have an account?
            </Link>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            disabled={loading}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
              fontWeight: '500',
              padding: '0.875rem 1.5rem',
              border: '2px solid var(--sub-color)',
              borderRadius: '0.5rem',
              backgroundColor: 'transparent',
              color: 'var(--sub-color)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.25s ease',
              width: '100%',
              textTransform: 'lowercase',
              letterSpacing: '0.02em',
              opacity: loading ? 0.6 : 1,
              marginTop: '0.75rem'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.borderColor = 'var(--text-color)';
                e.target.style.color = 'var(--text-color)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.borderColor = 'var(--sub-color)';
                e.target.style.color = 'var(--sub-color)';
              }
            }}
          >
            continue as guest
          </button>
        </form>
      </div>
    </div>
  );
}