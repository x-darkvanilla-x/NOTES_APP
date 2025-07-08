"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

import { useRouter } from "next/navigation";

import { signIn } from "next-auth/react";

const NoteApp: React.FC = () => {
  const router = useRouter();

  const [currentView, setCurrentView] = useState<"signup" | "login">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    otp: "",
  });
  const [otpSent, setOtpSent] = useState(false);

  const [generatedOtp, setGeneratedOtp] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard"); 
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!formData.dateOfBirth) {
      setError("Date of birth is required");
      return false;
    }
    return true;
  };

  const handleSignIn = async () => {
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    setLoading(true);
    setError(null);

    let email = formData.email;
    let otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);

    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp, mode: "signin" }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setOtpSent(true);
      alert(`OTP sent to ${email}`);
    } else {
      console.error(data.error);
      alert(data.message || "Something went wrong.");
    }
  };

  const handleSendOTP = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    let email = formData.email;
    let otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);

    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp, mode: "signup" }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.status === 409) {
      setError("Email already registered. Please sign in instead.");
      return;
    }

    if (data.success) {
      setOtpSent(true);
      alert(`OTP sent to ${email}`);
    } else {
      console.error(data.error);
      alert(data.message || "Something went wrong.");
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (formData.otp === generatedOtp) {
        const name = formData.name;
        const dob = formData.dateOfBirth;
        const email = formData.email;

        if (currentView === "signup") {
          const res = await fetch("/api/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, dob, email }),
          });

          const data = await res.json();

          if (data.success && data.token) {
            localStorage.setItem("token", data.token);
            alert("🎉 Signup successful!");
            router.push("/dashboard");
          } else {
            setError(data.message || "Signup failed.");
          }
        } else if (currentView === "login") {
          const res = await fetch("/api/signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, dob, email }),
          });

          const data = await res.json();

          if (data.success && data.token) {
            localStorage.setItem("token", data.token);
            alert("🎉 Signup successful!");
            router.push("/dashboard");
          } else {
            setError(data.message || "Signup failed.");
          }
        }
      } else {
        setError("❌ Invalid OTP");
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    signIn("google", {
      callbackUrl: "/dashboard",
    });
  };

  if (currentView === "login") {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Sign in</h1>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {!otpSent ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="test12345@gmail.com"
                    />
                  </div>

                  <button
                    onClick={handleSignIn}
                    disabled={loading}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      name="otp"
                      value={formData.otp}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="123456"
                      maxLength={6}
                    />
                  </div>

                  <button
                    onClick={handleVerifyOTP}
                    disabled={loading}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>

                  <button
                    onClick={() => {
                      setOtpSent(false);
                      setFormData((prev) => ({ ...prev, otp: "" }));
                      setError(null);
                    }}
                    className="w-full text-blue-500 hover:text-blue-600 text-sm"
                  >
                    Back to form
                  </button>
                </div>
              )}

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full mt-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Google</span>
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Register Account?{" "}
                  <button
                    onClick={() => setCurrentView("signup")}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden rounded-l-3xl">
          <Image
            src="/bg-image.jpg"
            alt="Hero Image"
            layout="fill"
            objectFit="cover"
            className="transition-all duration-500 ease-in-out"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Sign up</h1>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {!otpSent ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Dipesh Adelkar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="test12345@gmail.com"
                  />
                </div>

                <button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>

                <button
                  onClick={handleVerifyOTP}
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>

                <button
                  onClick={() => {
                    setOtpSent(false);
                    setFormData((prev) => ({ ...prev, otp: "" }));
                    setError(null);
                  }}
                  className="w-full text-blue-500 hover:text-blue-600 text-sm"
                >
                  Back to form
                </button>
              </div>
            )}

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full mt-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Google</span>
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={() => setCurrentView("login")}
                  className="text-blue-500 hover:text-blue-600"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden rounded-l-3xl">
        <Image
          src="/bg-image.jpg"
          alt="Hero Image"
          layout="fill"
          objectFit="cover"
          className="transition-all duration-500 ease-in-out"
        />
      </div>
    </div>
  );
};

export default NoteApp;