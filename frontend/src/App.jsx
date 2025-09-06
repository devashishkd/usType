import React from "react";
import { Outlet } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: 'var(--bg-color)' }}>
      <Navbar />
      <div className="container flex-1 flex flex-col">
        <main className="fade-in flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}