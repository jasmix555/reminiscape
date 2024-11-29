// src/components/Header.tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useProfile } from "@/hooks";

const Header = () => {
  const { profile, loading } = useProfile();
  const [opacity, setOpacity] = useState(0.4);

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
    <header className='fixed left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-2 text-white'>
      <div
        className='absolute left-0 right-0 top-0 h-full'
        style={{ opacity }}
      />
      {/* Profile Picture on the Left */}
      <Link
        className='absolute left-4 top-2 z-10 cursor-pointer'
        href={"/setup-profile"}
      >
        <Image
          alt='User Profile'
          className='h-10 w-10 rounded-full object-cover'
          height={40}
          src={photoURL}
          width={40}
        />
      </Link>
      {/* Centered Logo Name */}
      <Link
        className='absolute left-1/2 top-2 z-10 transform -translate-x-1/2 text-2xl font-bold text-black'
        href={"/"}
      >
        Reminiscape
      </Link>
    </header>
  );
};

export default Header;
