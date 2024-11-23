// src/hooks/useMarkers.ts
import { useEffect, useState } from "react";
import { db } from "../libs/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { Marker } from "@/types"; // Import the Marker type

const useMarkers = () => {
  const [markers, setMarkers] = useState<Marker[]>([]); // Use Marker type

  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "markers"));
        const markersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Marker[]; // Cast to Marker type
        setMarkers(markersData);
      } catch (error) {
        console.error("Error fetching markers: ", error);
      }
    };

    fetchMarkers();
  }, []);

  const addMarker = async (marker: Marker) => {
    try {
      const docRef = await addDoc(collection(db, "markers"), marker);
      setMarkers((prev) => [...prev, { ...marker, id: docRef.id }]);
    } catch (error) {
      console.error("Error adding marker: ", error);
    }
  };

  const updateMarker = async (id: string, updatedData: Partial<Marker>) => {
    try {
      const markerRef = doc(db, "markers", id);
      await updateDoc(markerRef, updatedData);
      setMarkers((prev) =>
        prev.map((marker) =>
          marker.id === id ? { ...marker, ...updatedData } : marker
        )
      );
    } catch (error) {
      console.error("Error updating marker: ", error);
    }
  };

  return { markers, addMarker, updateMarker };
};

export default useMarkers;
