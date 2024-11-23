"use client";

import { useState, FormEvent } from "react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  Auth,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import Link from "next/link";
import Image from "next/image";

import { useAuth } from "@/hooks";
import { auth } from "@/libs/firebaseConfig";
import { Loading } from "@/components";

export default function Login() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const router = useRouter();

  if (loading) return <Loading />;
  if (user) return null;

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth as Auth, email, password);
      router.push("/");
    } catch (err) {
      const error = err as FirebaseError;

      console.error(error);
      setError("Login failed. Incorrect email address or password.");
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();

    setIsGoogleLoading(true);
    try {
      await signInWithPopup(auth as Auth, provider);
      router.push("/");
    } catch (err) {
      const error = err as FirebaseError;

      console.error("Google Sign-In Error: ", error);
      setError("Google Sign-In failed.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className='container mx-auto max-w-md p-6'>
      <form className='flex flex-col gap-6' onSubmit={handleSubmit}>
        <h1 className='text-center text-3xl font-bold'>Login</h1>
        <div className='flex flex-col gap-4'>
          <div className='relative'>
            <input
              required
              aria-label='Email Address'
              className='w-full border-b-2 border-gray-500 bg-transparent px-3 py-2 placeholder-gray-500 focus:border-yellow-900 focus:outline-none'
              placeholder='Email Address'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className='relative'>
            <input
              required
              aria-label='Password'
              className='w-full border-b-2 border-gray-500 bg-transparent px-3 py-2 placeholder-gray-500 focus:border-yellow-900 focus:outline-none'
              placeholder='Password'
              type={isPasswordVisible ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              className='absolute right-3 top-3 text-gray-600 hover:text-gray-800'
              type='button'
              onClick={togglePasswordVisibility}
            >
              {isPasswordVisible ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
            </button>
          </div>
          {error && (
            <p
              aria-live='assertive'
              className='text-center text-red-600'
              role='alert'
            >
              {error}
            </p>
          )}
        </div>

        <button
          className={`w-full rounded py-2 font-bold text-white transition ${
            email && password
              ? "bg-yellow-900 hover:bg-yellow-800"
              : "cursor-not-allowed bg-gray-300"
          }`}
          disabled={!email || !password}
          type='submit'
        >
          Login
        </button>

        <div className='my-4 flex items-center'>
          <hr className='flex-grow border-t border-gray-300' />
          <span className='mx-4 text-gray-500'>or</span>
          <hr className='flex-grow border-t border-gray-300' />
        </div>

        <button
          aria-label='Sign in with Google'
          className={`flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white py-2 font-bold text-gray-700 transition ${
            isGoogleLoading ? "cursor-not-allowed opacity-50" : ""
          }`}
          disabled={isGoogleLoading}
          onClick={handleGoogleSignIn}
        >
          <Image alt='Google' height={24} src='/google.svg' width={24} />
          <span>
            {isGoogleLoading ? "Signing in..." : "Sign in with Google"}
          </span>
        </button>

        <div className='mt-4 text-center'>
          <p className='text-lg'>
            Don't have an account?{" "}
            <Link className='font-bold text-yellow-900' href='/register'>
              Sign up now
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
