"use client";
import {useEffect} from "react";

import {Loading} from "@/components";
import LogoutButton from "@/components/LogoutButton";
import {useAuth} from "@/hooks";

export default function HomePage() {
  const {user, loading} = useAuth();

  useEffect(() => {
    if (!loading && user) {
      console.log("User is authenticated:", user);
    }
  }, [loading, user]);

  if (loading) return <Loading />;

  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      {user ? <p>Hello, {user.displayName}</p> : <p>Please log in.</p>}
      <LogoutButton />
    </div>
  );
}
