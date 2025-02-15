// src/components/Header.tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion"; // Import Framer Motion
import { FaGear, FaUsers, FaHouse } from "react-icons/fa6";

import { useProfile } from "@/hooks";

const Header = () => {
  const { profile, loading } = useProfile();
  const [opacity, setOpacity] = useState(0.4);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const newOpacity = Math.max(0.1, 0.4 - scrollY / 100);

      setOpacity(newOpacity);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (loading) return null;

  const photoURL = profile?.photoURL || "/default-profile.png";

  return (
    <>
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-2 text-white">
        <div
          className="absolute left-0 right-0 top-0 h-full"
          style={{ opacity }}
        />
        {/* Gear Icon for Settings (Left Side) */}
        <div
          className="absolute left-4 top-4 z-10 cursor-pointer flex items-center space-x-2"
          onClick={() => setIsSidebarOpen(true)} // Open the sidebar
        >
          <FaGear className="h-8 w-8 text-black" />
        </div>
        {/* Centered Logo Name */}
        <Link
          className="absolute left-1/2 top-4 z-10 transform -translate-x-1/2 text-2xl font-bold text-black"
          href={"/"}
        >
          Reminiscape
        </Link>
      </header>

      {/* Sidebar with Framer Motion */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50"
          onClick={() => setIsSidebarOpen(false)} // Close the sidebar when clicking background
        >
          <motion.div
            animate={{ x: 0 }} // Slide in to its position
            className="absolute left-0 top-0 h-full w-64 bg-gray-100 shadow-lg rounded-r-lg px-4 "
            exit={{ x: "-100%" }} // Slide out when closing
            initial={{ x: "-100%" }} // Start off-screen to the left
            transition={{
              type: "spring",
              stiffness: 150, // Increased stiffness for faster animation
              damping: 20, // Reduced damping for quicker stop
              velocity: 15, // Increased velocity for faster start
            }} // Faster smooth spring animation
          >
            {/* Profile Picture and Username on Top of Sidebar */}
            <div className="flex flex-col items-center mt-8">
              <Image
                alt="User Profile"
                className="h-20 w-20 rounded-full object-cover"
                height={80}
                src={photoURL}
                width={80}
              />
              <p className="mt-4 text-lg font-semibold text-gray-800">
                {profile?.displayName || profile?.username || "Setup Profile"}
              </p>
            </div>

            <button
              className="absolute top-4 right-4 text-black"
              onClick={() => setIsSidebarOpen(false)} // Close the sidebar
            >
              ✕
            </button>
            <nav className="mt-16 grid gap-4">
              <Link
                className="text-lg font-medium text-gray-700 hover:text-blue-600 border rounded-full border-gray-300 px-4 py-2 flex items-center justify-center  w-full"
                href="/"
                onClick={() => setIsSidebarOpen(false)} // Close the sidebar on navigation
              >
                <FaHouse className="inline-block mr-2" />
                <span className="w-20">Home</span>
              </Link>
              <Link
                className="text-lg font-medium text-gray-700 hover:text-blue-600 border rounded-full border-gray-300 px-4 py-2 flex items-center justify-center  w-full"
                href="/friends"
                onClick={() => setIsSidebarOpen(false)} // Close the sidebar on navigation
              >
                <FaUsers className="inline-block mr-2" />
                <span className="w-20">Friends</span>
              </Link>
              <Link
                className="text-lg font-medium text-gray-700 hover:text-blue-600 border rounded-full border-gray-300 px-4 py-2 flex items-center justify-center  w-full"
                href="/setup-profile"
                onClick={() => setIsSidebarOpen(false)} // Close the sidebar on navigation
              >
                <FaGear className="inline-block mr-2" />
                <span className="w-20">Settings</span>
              </Link>
            </nav>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default Header;
