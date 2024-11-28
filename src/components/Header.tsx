// src/components/Header.tsx
"use client"; // Ensure this is at the top of the file
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useProfile } from "@/hooks";

const Header = () => {
  const { profile, loading } = useProfile();
  const [opacity, setOpacity] = useState(0.4); // Initial opacity for the background

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const newOpacity = Math.max(0.1, 0.4 - scrollY / 100); // Adjust opacity based on scroll

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
    <header className="fixed left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-2 text-white">
      <div
        className="absolute left-0 right-0 top-0 h-full "
        style={{ opacity }}
      />
      <Link className="relative z-10 cursor-pointer" href={"/setup-profile"}>
        <Image
          alt="User Profile"
          className="h-10 w-10 rounded-full object-cover"
          height={40}
          src={photoURL}
          width={40}
        />
      </Link>
      <Link
        className="z-10 flex-grow text-center text-2xl font-bold text-white"
        href={"/"}
      >
        Reminiscape
      </Link>
    </header>
  );
};

export default Header; // Ensure this line is present
