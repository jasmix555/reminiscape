// components/Logout.tsx
import {signOut} from "firebase/auth";
import {useRouter} from "next/navigation";

import {auth} from "@/libs/firebaseConfig";

export default function LogoutButton({className}: {className?: string}) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/welcome"); // Redirect to welcome page after logout
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  return (
    <button
      className={`ml-2 mt-4 rounded-full border-2 border-red-600 bg-none px-4 py-2 text-red-600 transition duration-100 ease-in-out hover:bg-red-600 hover:text-white ${className}`}
      onClick={handleLogout}
    >
      Logout
    </button>
  );
}
