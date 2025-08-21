import React from "react";
import { Outlet } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: 'var(--bg-color)' }}>
      <Navbar />
      <div className="container">
        <main className="fade-in">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}