"use client";
import {useState, FormEvent} from "react";
import {getFirestore, doc, setDoc} from "firebase/firestore";
import {useRouter} from "next/navigation";

import {auth} from "@/libs/firebaseConfig"; // Adjust the import path as necessary

const db = getFirestore(); // Initialize Firestore

export default function UsernamePage() {
  const [username, setUsername] = useState("");
  const [email] = useState(auth.currentUser?.email || ""); // Get the registered email
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid); // Create a document reference for the user

        await setDoc(userDocRef, {username}); // Save the username
        router.push("/"); // Redirect to the homepage or another page after successful submission
      }
    } catch (error) {
      setError("An error occurred while saving the username. Please try again.");
      console.error("Error saving username:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="container mx-auto max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">Enter your name</h1>
        {error && <p className="mb-4 text-center text-red-600">{error}</p>}

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="email">
              Registered Email Address
            </label>
            <input
              readOnly
              className="mt-1 block w-full border-b-2 border-gray-300 bg-gray-100 px-3 py-2 text-gray-500 placeholder-gray-500 outline-none"
              id="email"
              type="email"
              value={email}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="username">
              Username
            </label>
            <input
              required
              className="mt-1 block w-full border-b-2 border-gray-300 bg-transparent px-3 py-2 placeholder-gray-500 transition duration-150 ease-in-out focus:border-yellow-900 focus:outline-none"
              id="username"
              placeholder="Enter your username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <button
            className={`w-full rounded-full py-2 font-bold text-white transition duration-150 ease-in-out ${
              loading || !username
                ? "cursor-not-allowed bg-gray-400"
                : "bg-yellow-900 hover:bg-yellow-800"
            }`}
            disabled={loading || !username} // Disable the button if loading or username is empty
            type="submit"
          >
            {loading ? "Saving..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
