"use client";

import { useState, useEffect } from "react";
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
  FaUser,
  FaUserPlus,
} from "react-icons/fa";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

import { db } from "@/libs/firebaseConfig";
import { UserProfile } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { Loading } from "@/components";

// Avatar with graceful icon fallback (no broken-image alt text).
const UserAvatar = ({ src, size = 48 }: { src?: string; size?: number }) => {
  const [errored, setErrored] = useState(false);
  const show = src && src.trim() !== "" && !errored;

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-raised ring-1 ring-line"
      style={{ width: size, height: size }}
    >
      {show ? (
        <img
          alt="User"
          className="h-full w-full object-cover"
          src={src}
          onError={() => setErrored(true)}
        />
      ) : (
        <FaUser className="text-ink-faint" style={{ fontSize: size * 0.4 }} />
      )}
    </div>
  );
};

const TABS = [
  { id: "friends", label: "Friends", icon: FaUsers },
  { id: "search", label: "Search", icon: FaSearch },
  { id: "requests", label: "Requests", icon: FaUserCheck },
] as const;

const FriendsPage = () => {
  const { user, profile, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<UserProfile[]>([]);
  const [addingFriend, setAddingFriend] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"friends" | "search" | "requests">(
    "friends",
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const searchUsers = async () => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) return;

    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("username", ">=", trimmedQuery),
        where("username", "<=", trimmedQuery + ""),
      );

      const querySnapshot = await getDocs(q);
      const users: UserProfile[] = [];

      querySnapshot.forEach((doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const username = userData.username;

          if (username === trimmedQuery) {
            users.push({ ...userData, uid: doc.id } as UserProfile);
          }
        }
      });

      setSearchResults(
        users.filter((foundUser) => foundUser.uid !== profile?.uid),
      );
    } catch (error) {
      console.error("Error searching for users:", error);
      toast.error("Failed to search for users.");
    }
  };

  const handleSendFriendRequest = async (receiverId: string) => {
    if (!receiverId || receiverId === profile?.uid) {
      toast.error("You cannot send a friend request to yourself.");

      return;
    }

    if (!user?.uid) {
      toast.error("User is not authenticated.");

      return;
    }

    setAddingFriend(receiverId);

    try {
      const receiverRef = doc(db, "users", receiverId);
      const receiverDoc = await getDoc(receiverRef);

      if (receiverDoc.exists()) {
        const receiverData = receiverDoc.data();

        if (
          receiverData.friendRequests &&
          receiverData.friendRequests.includes(user?.uid)
        ) {
          toast.error("Friend request already sent!");

          return;
        }
      }

      await updateDoc(receiverRef, {
        friendRequests: arrayUnion(user?.uid || ""),
      });

      toast.success("Friend request sent!");

      setSearchResults((prevResults) =>
        prevResults.map((result) =>
          result.uid === receiverId ? { ...result, requestSent: true } : result,
        ),
      );
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request.");
    } finally {
      setAddingFriend(null);
    }
  };

  const fetchFriendsDetails = async () => {
    if (!profile?.friends || profile.friends.length === 0) {
      setFriends([]);

      return;
    }

    try {
      const friendsList: UserProfile[] = [];

      for (const friendId of profile.friends) {
        const friendDoc = await getDoc(doc(db, "users", friendId));

        if (friendDoc.exists()) {
          friendsList.push({
            ...friendDoc.data(),
            uid: friendDoc.id,
          } as UserProfile);
        }
      }
      setFriends(friendsList);
    } catch (error) {
      console.error("Error fetching friends:", error);
      toast.error("Failed to fetch friends list.");
    }
  };

  const fetchFriendRequests = async () => {
    if (!profile?.friendRequests || profile.friendRequests.length === 0) {
      setFriendRequests([]);

      return;
    }

    try {
      const requestsList: UserProfile[] = [];

      for (const senderId of profile.friendRequests) {
        const senderDoc = await getDoc(doc(db, "users", senderId));

        if (senderDoc.exists()) {
          requestsList.push({
            ...senderDoc.data(),
            uid: senderDoc.id,
          } as UserProfile);
        }
      }
      setFriendRequests(requestsList);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      toast.error("Failed to fetch friend requests.");
    }
  };

  const handleAcceptRequest = async (senderId: string) => {
    try {
      const userRef = doc(db, "users", user?.uid || "");
      const senderRef = doc(db, "users", senderId);

      await updateDoc(userRef, {
        friends: arrayUnion(senderId),
        friendRequests: arrayRemove(senderId),
      });

      await updateDoc(senderRef, {
        friends: arrayUnion(user?.uid || ""),
      });

      toast.success("Friend request accepted!");
      setFriendRequests((prev) => prev.filter((req) => req.uid !== senderId));
      fetchFriendsDetails();
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request.");
    }
  };

  const handleDeclineRequest = async (senderId: string) => {
    try {
      const userRef = doc(db, "users", user?.uid || "");

      await updateDoc(userRef, {
        friendRequests: arrayRemove(senderId),
      });

      toast.success("Friend request declined!");
      setFriendRequests((prev) => prev.filter((req) => req.uid !== senderId));
    } catch (error) {
      console.error("Error declining friend request:", error);
      toast.error("Failed to decline friend request.");
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      const userRef = doc(db, "users", user?.uid || "");
      const friendRef = doc(db, "users", friendId);

      await updateDoc(userRef, {
        friends: arrayRemove(friendId),
      });

      await updateDoc(friendRef, {
        friends: arrayRemove(user?.uid || ""),
      });

      toast.success("Friend removed successfully!");
      setFriends((prevFriends) =>
        prevFriends.filter((friend) => friend.uid !== friendId),
      );
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("Failed to remove friend.");
    }
  };

  useEffect(() => {
    if (activeTab === "friends") fetchFriendsDetails();
    if (activeTab === "requests") fetchFriendRequests();
  }, [activeTab, profile]);

  useEffect(() => {
    if (searchQuery.trim()) searchUsers();
    else setSearchResults([]);
  }, [searchQuery]);

  if (loading || !profile) return <Loading />;

  const isSelf = (uid: string) => uid === profile?.uid;

  return (
    <div className="min-h-screen bg-background text-ink">
      <div className="mx-auto w-full max-w-md px-4 pb-16 pt-[max(1rem,env(safe-area-inset-top))]">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link aria-label="Back" className="ctrl-btn h-10 w-10" href="/">
            <FaArrowLeft className="h-4 w-4 text-ink" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Friends</h1>
        </div>

        {/* Segmented tabs */}
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

        {/* Friends */}
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
                    <UserAvatar src={friend.photoURL} />
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

        {/* Requests */}
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
                    <UserAvatar src={request.photoURL} />
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

        {/* Search */}
        {activeTab === "search" && (
          <div className="space-y-4">
            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                className="w-full rounded-full border border-line bg-surface-raised py-3 pl-11 pr-4 text-ink placeholder-ink-faint outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent"
                placeholder="Search by username"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
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
                  const alreadyFriend = profile?.friends?.includes(result.uid);
                  const requestPending =
                    addingFriend === result.uid ||
                    result.requestSent ||
                    profile?.friendRequests?.includes(result.uid);
                  const disabled =
                    isSelf(result.uid) || alreadyFriend || requestPending;

                  return (
                    <div
                      key={result.uid}
                      className="glass flex items-center justify-between rounded-2xl p-3"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar src={result.photoURL} />
                        <p className="font-medium">{result.username}</p>
                      </div>
                      <button
                        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          disabled
                            ? "cursor-not-allowed bg-white/10 text-ink-faint"
                            : "bg-accent text-black hover:bg-accent-soft"
                        }`}
                        disabled={disabled}
                        onClick={() => {
                          if (isSelf(result.uid)) {
                            toast.error(
                              "You cannot send a friend request to yourself.",
                            );

                            return;
                          }
                          handleSendFriendRequest(result.uid);
                        }}
                      >
                        {alreadyFriend ? (
                          <>
                            <FaCheck className="h-3.5 w-3.5" /> Added
                          </>
                        ) : requestPending ? (
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
