"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  FaSearch,
  FaUsers,
  FaUserCheck,
  FaTimes,
  FaCheck,
  FaTrash,
  FaArrowLeft,
  FaUserPlus,
} from "react-icons/fa";

import { supabase } from "@/libs/supabaseClient";
import { UserProfile } from "@/types";
import { Loading, Avatar } from "@/components";

// Map a profiles row -> the UI's UserProfile shape.
const mapProfile = (row: Record<string, any>): UserProfile => ({
  uid: row.id,
  email: row.email ?? "",
  username: row.username ?? "",
  photoURL: row.photo_url ?? "",
  friends: row.friends ?? [],
  friendRequests: row.friend_requests ?? [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const TABS = [
  { id: "friends", label: "Friends", icon: FaUsers },
  { id: "search", label: "Search", icon: FaSearch },
  { id: "requests", label: "Requests", icon: FaUserCheck },
] as const;

const FriendsPage = () => {
  const [authLoading, setAuthLoading] = useState(true);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<UserProfile[]>([]);
  const [addingFriend, setAddingFriend] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"friends" | "search" | "requests">(
    "friends",
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      setSelfId(user?.id ?? null);
      setAuthLoading(false);
    });
  }, []);

  // Always read the caller's own friends / requests fresh from the DB so the
  // lists reflect changes made via the RPCs.
  const fetchMyArrays = useCallback(async () => {
    if (!selfId) return { friends: [], friend_requests: [] };

    const { data } = await supabase
      .from("profiles")
      .select("friends, friend_requests")
      .eq("id", selfId)
      .maybeSingle();

    return {
      friends: (data?.friends as string[]) ?? [],
      friend_requests: (data?.friend_requests as string[]) ?? [],
    };
  }, [selfId]);

  const fetchProfilesByIds = async (ids: string[]) => {
    if (!ids.length) return [];

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .in("id", ids);

    if (error) {
      console.error(error);

      return [];
    }

    return (data ?? []).map(mapProfile);
  };

  const searchUsers = useCallback(async () => {
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      setSearchResults([]);

      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", trimmed)
      .neq("id", selfId ?? "");

    if (error) {
      console.error(error);
      toast.error("Failed to search for users.");

      return;
    }

    setSearchResults((data ?? []).map(mapProfile));
  }, [searchQuery, selfId]);

  const fetchFriends = useCallback(async () => {
    const { friends: ids } = await fetchMyArrays();

    setFriends(await fetchProfilesByIds(ids));
  }, [fetchMyArrays]);

  const fetchRequests = useCallback(async () => {
    const { friend_requests: ids } = await fetchMyArrays();

    setFriendRequests(await fetchProfilesByIds(ids));
  }, [fetchMyArrays]);

  const handleSendFriendRequest = async (receiverId: string) => {
    if (!receiverId || receiverId === selfId) {
      toast.error("You cannot send a friend request to yourself.");

      return;
    }

    setAddingFriend(receiverId);
    const { error } = await supabase.rpc("send_friend_request", {
      target: receiverId,
    });

    if (error) {
      console.error(error);
      toast.error("Failed to send friend request.");
    } else {
      toast.success("Friend request sent!");
      setSearchResults((prev) =>
        prev.map((r) =>
          r.uid === receiverId ? { ...r, requestSent: true } : r,
        ),
      );
    }
    setAddingFriend(null);
  };

  const handleAcceptRequest = async (senderId: string) => {
    const { error } = await supabase.rpc("accept_friend_request", {
      sender: senderId,
    });

    if (error) {
      console.error(error);
      toast.error("Failed to accept friend request.");

      return;
    }

    toast.success("Friend request accepted!");
    setFriendRequests((prev) => prev.filter((r) => r.uid !== senderId));
    fetchFriends();
  };

  const handleDeclineRequest = async (senderId: string) => {
    const { error } = await supabase.rpc("decline_friend_request", {
      sender: senderId,
    });

    if (error) {
      console.error(error);
      toast.error("Failed to decline friend request.");

      return;
    }

    toast.success("Friend request declined!");
    setFriendRequests((prev) => prev.filter((r) => r.uid !== senderId));
  };

  const handleRemoveFriend = async (friendId: string) => {
    const { error } = await supabase.rpc("remove_friend", { friend: friendId });

    if (error) {
      console.error(error);
      toast.error("Failed to remove friend.");

      return;
    }

    toast.success("Friend removed.");
    setFriends((prev) => prev.filter((f) => f.uid !== friendId));
  };

  useEffect(() => {
    if (authLoading) return;
    if (activeTab === "friends") fetchFriends();
    if (activeTab === "requests") fetchRequests();
  }, [activeTab, authLoading, fetchFriends, fetchRequests]);

  useEffect(() => {
    if (searchQuery.trim()) searchUsers();
    else setSearchResults([]);
  }, [searchQuery, searchUsers]);

  if (authLoading) return <Loading />;

  const isSelf = (uid: string) => uid === selfId;

  return (
    <div className="min-h-screen bg-background text-ink">
      <div className="mx-auto w-full max-w-md px-4 pb-16 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mb-6 flex items-center gap-3">
          <Link aria-label="Back" className="ctrl-btn h-10 w-10" href="/">
            <FaArrowLeft className="h-4 w-4 text-ink" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Friends</h1>
        </div>

        <div className="glass mb-6 flex gap-1 rounded-full p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition-colors ${
                activeTab === id
                  ? "bg-accent text-black"
                  : "text-ink-muted hover:text-ink"
              }`}
              onClick={() => setActiveTab(id)}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === "friends" && (
          <div className="space-y-2">
            {friends.length === 0 ? (
              <p className="py-10 text-center text-sm text-ink-faint">
                No friends added yet.
              </p>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.uid}
                  className="glass flex items-center justify-between rounded-2xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      className="ring-1 ring-line"
                      size={48}
                      src={friend.photoURL}
                    />
                    <p className="font-medium">{friend.username}</p>
                  </div>
                  <button
                    aria-label="Remove friend"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-red-500/40 text-red-400 transition-colors hover:bg-red-500/15"
                    onClick={() => handleRemoveFriend(friend.uid)}
                  >
                    <FaTrash className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "requests" && (
          <div className="space-y-2">
            {friendRequests.length === 0 ? (
              <p className="py-10 text-center text-sm text-ink-faint">
                No incoming friend requests.
              </p>
            ) : (
              friendRequests.map((request) => (
                <div
                  key={request.uid}
                  className="glass flex items-center justify-between rounded-2xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      className="ring-1 ring-line"
                      size={48}
                      src={request.photoURL}
                    />
                    <p className="font-medium">{request.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      aria-label="Accept"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-black transition-colors hover:bg-accent-soft"
                      onClick={() => handleAcceptRequest(request.uid)}
                    >
                      <FaCheck className="h-3.5 w-3.5" />
                    </button>
                    <button
                      aria-label="Decline"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-red-500/40 text-red-400 transition-colors hover:bg-red-500/15"
                      onClick={() => handleDeclineRequest(request.uid)}
                    >
                      <FaTimes className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "search" && (
          <div className="space-y-4">
            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                className="w-full rounded-full border border-line bg-surface-raised py-3 pl-11 pr-4 text-ink placeholder-ink-faint outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent"
                placeholder="Search by username"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {searchResults.length === 0 ? (
              <p className="py-10 text-center text-sm text-ink-faint">
                {searchQuery.trim()
                  ? "No users found."
                  : "Search for friends by username."}
              </p>
            ) : (
              <div className="space-y-2">
                {searchResults.map((result) => {
                  const requestPending =
                    addingFriend === result.uid || result.requestSent;
                  const disabled = isSelf(result.uid) || requestPending;

                  return (
                    <div
                      key={result.uid}
                      className="glass flex items-center justify-between rounded-2xl p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          className="ring-1 ring-line"
                          size={48}
                          src={result.photoURL}
                        />
                        <p className="font-medium">{result.username}</p>
                      </div>
                      <button
                        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          disabled
                            ? "cursor-not-allowed bg-white/10 text-ink-faint"
                            : "bg-accent text-black hover:bg-accent-soft"
                        }`}
                        disabled={disabled}
                        onClick={() => handleSendFriendRequest(result.uid)}
                      >
                        {requestPending ? (
                          <>
                            <FaUserCheck className="h-3.5 w-3.5" /> Sent
                          </>
                        ) : (
                          <>
                            <FaUserPlus className="h-3.5 w-3.5" /> Add
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
