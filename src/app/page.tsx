// src/app/page.tsx
import {getServerSession} from "next-auth";
import {redirect} from "next/navigation";
import Link from "next/link";

import {authOptions} from "./api/auth/[...nextauth]/route";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900">Reminiscape</h1>
            </div>
            <div className="flex items-center space-x-4">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "Profile"}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
                  <span className="text-gray-600">{session?.user?.name?.charAt(0) || "U"}</span>
                </div>
              )}
              <span className="text-gray-700">{session?.user?.name}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Welcome Section */}
            <div>
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">Welcome to Reminiscape</h2>
              <p className="mb-4 text-gray-600">
                Create and explore digital time capsules on an interactive map. Share your memories
                with photos, videos, and voice memos.
              </p>
              <div className="space-y-4">
                <Link
                  href="/create-memory"
                  className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center font-medium text-white transition duration-150 ease-in-out hover:bg-blue-700 sm:w-auto"
                >
                  Create New Memory
                </Link>
                <Link
                  href="/explore"
                  className="block w-full rounded-md border border-gray-300 px-4 py-2 text-center font-medium text-gray-700 transition duration-150 ease-in-out hover:border-gray-400 sm:w-auto"
                >
                  Explore Memories
                </Link>
              </div>
            </div>

            {/* Stats/Recent Activity */}
            <div className="rounded-lg bg-gray-50 p-6">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Your Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Memories</span>
                  <span className="font-medium text-gray-900">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Recent Views</span>
                  <span className="font-medium text-gray-900">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Shared Memories</span>
                  <span className="font-medium text-gray-900">0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Memories Section */}
          <div className="mt-8">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Recent Memories</h3>
            <div className="rounded-lg bg-gray-50 p-6 text-center">
              <p className="text-gray-600">
                You haven&apos;t created any memories yet. Start by creating your first memory!
              </p>
            </div>
          </div>

          {/* Quick Tips Section */}
          <div className="mt-8">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Quick Tips</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-2 font-medium text-gray-900">📍 Location-Based Memories</h4>
                <p className="text-sm text-gray-600">
                  Pin your memories to specific locations on the map to create a personal geography
                  of experiences.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-2 font-medium text-gray-900">🔒 Private Memories</h4>
                <p className="text-sm text-gray-600">
                  Keep your memories private or share them with specific people. You&apos;re in
                  control of your digital time capsules.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-2 font-medium text-gray-900">⏰ Time-Released Content</h4>
                <p className="text-sm text-gray-600">
                  Set your memories to be revealed at specific dates in the future, creating
                  surprise moments for yourself or others.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            © 2024 Reminiscape. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
