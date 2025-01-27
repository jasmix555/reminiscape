import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import { auth, db } from "@/libs/firebaseConfig"; // Import Firestore config
import { Loading } from "@/components";
import { useAuth } from "@/hooks";

export default function Register() {
  const { loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState<number | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // Store user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        username: email.split("@")[0], // Basic username logic
        photoURL: "", // Default placeholder for profile picture
        bio: "", // Default bio
        friends: [], // Initialize an empty friends array
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Send email verification
      await sendEmailVerification(user);
      setIsConfirming(true);
      startTimer();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
      console.error("Signup Error:", error);
    }
  };

  const startTimer = () => {
    const timerDuration = 300; // seconds

    setTimer(timerDuration);

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev === 1) {
          clearInterval(interval);

          return null;
        }

        return prev! - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (isConfirming) {
      const interval = setInterval(async () => {
        const user = auth.currentUser;

        if (user) {
          await user.reload(); // Reload to get updated user data
          if (user.emailVerified) {
            clearInterval(interval);
            router.push("/setup-profile"); // Redirect after email is verified
          }
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isConfirming, router]);

  const handleResendVerification = async () => {
    const user = auth.currentUser;

    if (user) {
      await sendEmailVerification(user);
      setError(null);
      startTimer();
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto max-w-md p-6">
      {error && <p className="mb-4 text-center text-red-600">{error}</p>}
      {!isConfirming ? (
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <h1 className="text-center text-3xl font-bold">
            Get Started with the App
          </h1>
          <p className="text-center text-sm">
            Please enter a valid email address.
          </p>
          <div className="flex flex-col gap-4">
            <input
              required
              className="w-full border-b-2 border-gray-500 bg-transparent px-3 py-2 placeholder-gray-500 focus:border-yellow-900 focus:outline-none"
              placeholder="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              required
              className="w-full border-b-2 border-gray-500 bg-transparent px-3 py-2 placeholder-gray-500 focus:border-yellow-900 focus:outline-none"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            className={`w-full rounded py-2 font-bold text-white transition ${
              !email || !password
                ? "cursor-not-allowed bg-gray-300"
                : "bg-yellow-900 hover:bg-yellow-800"
            }`}
            disabled={!email || !password}
            type="submit"
          >
            Verify Email Address
          </button>
        </form>
      ) : (
        <div className="text-center">
          <p className="mb-4 text-green-600">
            A confirmation email has been sent to {email}. Please check your
            inbox to activate your account.
          </p>
          <button
            className="text-blue-500 underline"
            onClick={handleResendVerification}
          >
            Resend
          </button>
          {timer !== null && (
            <p className="mt-2 text-sm text-gray-600">{`Resend available in ${timer} seconds`}</p>
          )}
          <p className="mt-4 text-red-600">
            Please verify your email to complete the registration process.
          </p>
        </div>
      )}
    </div>
  );
}
