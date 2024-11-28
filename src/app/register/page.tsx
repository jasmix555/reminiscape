"use client";
import Link from "next/link";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import Image from "next/image";

import { useAuth } from "@/hooks";
import { auth } from "@/libs/firebaseConfig";
import { Loading } from "@/components";

export default function Register() {
  const { loading } = useAuth(); // Call useAuth to trigger redirect
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
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

      // Send a verification email
      await sendEmailVerification(user);
      setIsConfirming(true);
      startTimer(); // Start the timer for email verification expiration
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
      console.error("Signup Error:", error);
    }
  };

  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();

    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Send a verification email if the user is newly created
      if (user && !user.emailVerified) {
        await sendEmailVerification(user);
        setIsConfirming(true);
        startTimer(); // Start the timer for email verification expiration
      } else {
        router.push("/setup-profile"); // Redirect to setup profile if already verified
      }
    } catch (error) {
      setError("Google Sign-Up failed.");
      console.error("Google Sign-Up Error:", error);
    } finally {
      setIsGoogleLoading(false);
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
          await user.reload();
          if (user.emailVerified) {
            setIsVerified(true);
            clearInterval(interval);
            router.push("/setup-profile"); // Redirect to setup profile after verification
          }
        }
      }, 3000); // Check every 3 seconds

      return () => clearInterval(interval);
    }
  }, [isConfirming, router]);

  const handleResendVerification = async () => {
    const user = auth.currentUser;

    if (user) {
      await sendEmailVerification(user);
      setError(null);
      startTimer(); // Restart the timer on resend
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

          <div className="my-4 flex items-center">
            <hr className="flex-grow border-t border-gray-300" />
            <span className="mx-4 text-gray-500">or</span>
            <hr className="flex-grow border-t border-gray-300" />
          </div>

          <button
            aria-label="Sign up with Google"
            className={`flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white py-2 font-bold text-gray-700 transition ${
              isGoogleLoading ? "cursor-not-allowed opacity-50" : ""
            }`}
            disabled={isGoogleLoading}
            onClick={handleGoogleSignUp}
          >
            <Image alt="Google" height={24} src="/google.svg" width={24} />
            <span>
              {isGoogleLoading ? "Signing up..." : "Sign up with Google"}
            </span>
          </button>

          <div className="mt-4 text-center">
            <p className="text-lg">
              Already have an account?{" "}
              <Link className="font-bold text-yellow-900" href="/login">
                Log in
              </Link>
            </p>
          </div>
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
