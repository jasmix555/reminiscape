// src/components/layout/Header.tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaGear,
  FaUsers,
  FaHouse,
  FaUser,
  FaClockRotateLeft,
  FaArrowRightFromBracket,
  FaXmark,
} from "react-icons/fa6";

import Avatar from "../ui/Avatar";

import { useAuth } from "@/hooks";
import { supabase } from "@/libs/supabaseClient";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: FaHouse },
  { href: "/memories", label: "Memories", icon: FaClockRotateLeft },
  { href: "/friends", label: "Friends", icon: FaUsers },
  { href: "/setup-profile", label: "Profile", icon: FaUser },
  { href: "/settings", label: "Settings", icon: FaGear },
];

const Header = () => {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (loading) return null;

  const photoURL = profile?.photoURL;
  const displayName =
    profile?.displayName || profile?.username || "Set up profile";

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/welcome");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          aria-label="Open menu"
          className="ctrl-btn pointer-events-auto h-11 w-11 overflow-hidden p-0"
          type="button"
          onClick={() => setIsOpen(true)}
        >
          <Avatar size={44} src={photoURL} />
        </button>

        <Link
          className="glass pointer-events-auto rounded-full px-5 py-2 text-lg font-semibold tracking-tight text-ink shadow-glass"
          href="/"
        >
          Reminiscape
        </Link>

        <div className="h-11 w-11" />
      </header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.aside
              animate={{ x: 0 }}
              className="glass-strong absolute left-0 top-0 flex h-full w-[82%] max-w-[20rem] flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] shadow-glass-lg"
              exit={{ x: "-100%" }}
              initial={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                aria-label="Close menu"
                className="ctrl-btn absolute right-4 top-4 h-9 w-9"
                type="button"
                onClick={() => setIsOpen(false)}
              >
                <FaXmark className="h-4 w-4 text-ink" />
              </button>

              <Link
                className="mt-6 flex flex-col items-center gap-3"
                href="/setup-profile"
                onClick={() => setIsOpen(false)}
              >
                <div className="h-20 w-20 overflow-hidden rounded-full ring-2 ring-accent/60">
                  <Avatar size={80} src={photoURL} />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-ink">
                    {displayName}
                  </p>
                  {profile?.email && (
                    <p className="text-xs text-ink-faint">{profile.email}</p>
                  )}
                </div>
              </Link>

              <nav className="mt-10 flex flex-col gap-2">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href;

                  return (
                    <Link
                      key={href}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                        active
                          ? "bg-accent/15 text-accent"
                          : "text-ink-muted hover:bg-white/5 hover:text-ink"
                      }`}
                      href={href}
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                      {label}
                    </Link>
                  );
                })}
              </nav>

              <button
                className="mt-auto flex items-center justify-center gap-2 rounded-xl border border-red-500/40 px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/15"
                type="button"
                onClick={handleLogout}
              >
                <FaArrowRightFromBracket className="h-4 w-4" />
                Log out
              </button>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
