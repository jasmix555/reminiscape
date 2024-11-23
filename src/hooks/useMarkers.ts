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

const useMarkers = () => {
  const [markers, setMarkers] = useState<any[]>([]);

  useEffect(() => {
    const fetchMarkers = async () => {
      const querySnapshot = await getDocs(collection(db, "markers"));
      const markersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMarkers(markersData);
    };

    fetchMarkers();
  }, []);

  const addMarker = async (marker: any) => {
    const docRef = await addDoc(collection(db, "markers"), marker);
    setMarkers((prev) => [...prev, { ...marker, id: docRef.id }]);
  };

  const updateMarker = async (id: string, updatedData: any) => {
    const markerRef = doc(db, "markers", id);
    await updateDoc(markerRef, updatedData);
    setMarkers((prev) =>
      prev.map((marker) =>
        marker.id === id ? { ...marker, ...updatedData } : marker
      )
    );
  };

  return { markers, addMarker, updateMarker };
};

export default useMarkers;
