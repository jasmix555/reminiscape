// src/components/auth/AuthButton.tsx
import React from "react";
interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "default" | "google";
  children: React.ReactNode;
}

export default function AuthButton({
  isLoading,
  variant = "default",
  children,
  ...props
}: AuthButtonProps) {
  const baseStyles =
    "w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";

  const variantStyles = {
    default: "border-transparent text-white bg-blue-600 hover:bg-blue-700",
    google: "border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
  };

  return (
    <button {...props} disabled={isLoading} className={`${baseStyles} ${variantStyles[variant]}`}>
      {isLoading ? (
        <div className="flex items-center">
          <svg
            className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
}
