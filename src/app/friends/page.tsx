"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  FaSearch,
  FaUserPlus,
  FaUsers,
  FaUserCheck,
  FaTimes,
  FaCheck,
  FaTrash,
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

  // Search Users
  const searchUsers = async () => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) return;

    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("username", ">=", trimmedQuery),
        where("username", "<=", trimmedQuery + "\uf8ff"),
      );

      const querySnapshot = await getDocs(q);
      const users: UserProfile[] = [];

      querySnapshot.forEach((doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const username = userData.username;

          // Check if the username matches the exact query
          if (username === trimmedQuery) {
            users.push({ ...userData, uid: doc.id } as UserProfile);
          }
        }
      });

      // Filter out the current user from the search results
      setSearchResults(
        users.filter((foundUser) => foundUser.uid !== profile?.uid),
      );
    } catch (error) {
      console.error("Error searching for users:", error);
      toast.error("Failed to search for users.");
    }
  };

  // Send Friend Request
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

      // Check if the friendRequests array already contains the current user's UID
      const receiverDoc = await getDoc(receiverRef);

      if (receiverDoc.exists()) {
        const receiverData = receiverDoc.data();

        if (
          receiverData.friendRequests &&
          receiverData.friendRequests.includes(user?.uid)
        ) {
          toast.error("Friend request already sent!");

          return; // Exit if the request has already been sent
        }
      }

      // Add the current user's UID to the receiver's friendRequests array
      await updateDoc(receiverRef, {
        friendRequests: arrayUnion(user?.uid || ""),
      });

      toast.success("Friend request sent!");

      // Update the UI for search results (mark as request sent)
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

  // Fetch Friends
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

  // Fetch Friend Requests
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

  // Accept Friend Request
  const handleAcceptRequest = async (senderId: string) => {
    try {
      const userRef = doc(db, "users", user?.uid || "");
      const senderRef = doc(db, "users", senderId);

      // Add each user to the other's friends list
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

  // Decline Friend Request
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

  // Remove Friend
  const handleRemoveFriend = async (friendId: string) => {
    try {
      const userRef = doc(db, "users", user?.uid || "");
      const friendRef = doc(db, "users", friendId);

      // Remove the friend from both users' friends lists
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

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="flex space-x-4 mb-6 mt-16">
        <button
          className={`p-2 rounded-md ${
            activeTab === "friends"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-600"
          }`}
          onClick={() => setActiveTab("friends")}
        >
          <FaUsers className="inline-block mr-2" />
          Friends
        </button>
        <button
          className={`p-2 rounded-md ${
            activeTab === "search"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-600"
          }`}
          onClick={() => setActiveTab("search")}
        >
          <FaSearch className="inline-block mr-2" />
          Search
        </button>
        <button
          className={`p-2 rounded-md ${
            activeTab === "requests"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-600"
          }`}
          onClick={() => setActiveTab("requests")}
        >
          <FaUserCheck className="inline-block mr-2" />
          Requests
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "friends" && (
        <div>
          {friends.length === 0 ? (
            <p>No friends added yet.</p>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.uid}
                className="flex items-center justify-between p-4 border rounded-lg border-gray-300 bg-gray-100 bg-opacity-50 mb-2"
              >
                <div className="flex items-center">
                  <img
                    alt={friend.username || "User"}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                    src={friend.photoURL || "/default-profile.png"}
                  />
                  <p>{friend.username}</p>
                </div>
                <button
                  className="p-2 bg-red-500 text-white rounded-md"
                  onClick={() => handleRemoveFriend(friend.uid)}
                >
                  <FaTrash />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "requests" && (
        <div>
          {friendRequests.length === 0 ? (
            <p>No incoming friend requests.</p>
          ) : (
            friendRequests.map((request) => (
              <div
                key={request.uid}
                className="flex items-center justify-between p-4 border rounded-lg border-gray-300 bg-gray-100 bg-opacity-50"
              >
                <div className="flex items-center">
                  <img
                    alt={request.username || "User"}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                    src={request.photoURL || "/default-profile.png"}
                  />
                  <p>{request.username}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="p-2 bg-blue-500 text-white rounded-md"
                    onClick={() => handleAcceptRequest(request.uid)}
                  >
                    <FaCheck />
                  </button>
                  <button
                    className="p-2 bg-red-500 text-white rounded-md"
                    onClick={() => handleDeclineRequest(request.uid)}
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "search" && (
        <div>
          <div className="flex items-center space-x-2 mb-6">
            <input
              className="px-4 py-2 w-full rounded-md border border-gray-300"
              placeholder="Search by username"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <button
              className="p-3 bg-blue-500 text-white rounded-md"
              onClick={searchUsers}
            >
              <FaSearch />
            </button>
          </div>

          {searchResults.length === 0 ? (
            <p>No users found.</p>
          ) : (
            searchResults.map((result) => (
              <div
                key={result.uid}
                className="flex items-center justify-between p-4 border rounded-lg border-gray-300 bg-gray-100 bg-opacity-50"
              >
                <div className="flex items-center">
                  <img
                    alt={result.username || "User"}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                    src={result.photoURL || "/default-profile.png"}
                  />
                  <p>{result.username}</p>
                </div>
                <button
                  className={`p-2 bg-blue-500 text-white rounded-md ${
                    result.uid === profile?.uid ||
                    addingFriend === result.uid ||
                    result.requestSent ||
                    profile?.friends?.includes(result.uid)
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={
                    result.uid === profile?.uid || // Disable if the searched user is the current user
                    addingFriend === result.uid ||
                    profile?.friendRequests?.includes(result.uid) ||
                    result.requestSent ||
                    profile?.friends?.includes(result.uid) // Disable if already friends
                  }
                  onClick={() => {
                    if (result.uid === profile?.uid) {
                      toast.error(
                        "You cannot send a friend request to yourself.",
                      );

                      return; // Prevent sending request to oneself
                    }
                    handleSendFriendRequest(result.uid); // Proceed with sending friend request
                  }}
                >
                  {result.uid === profile?.uid
                    ? "You Cannot Add Yourself"
                    : profile?.friends?.includes(result.uid)
                      ? "Already Added"
                      : addingFriend === result.uid || result.requestSent
                        ? "Request Sent"
                        : "Add Friend"}

                  {result.uid === profile?.uid && (
                    <FaUserPlus className="inline-block ml-2" />
                  )}
                  {profile?.friends?.includes(result.uid) && (
                    <FaCheck className="inline-block ml-2" />
                  )}
                  {addingFriend === result.uid && (
                    <FaUserCheck className="inline-block ml-2" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FriendsPage;
