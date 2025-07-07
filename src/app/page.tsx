"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Trash2, Plus, LogOut, User } from "lucide-react";
import Image from "next/image";

interface User {
  id: string;
  name: string;
  email: string;
  authMethod: "email" | "google";
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

// Mock API functions (replace with actual backend calls)
const mockAPI = {
  sendOTP: async (email: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true, message: "OTP sent successfully" };
  },

  verifyOTP: async (email: string, otp: string) => {
    // Simulate OTP verification
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (otp === "123456") {
      const user = {
        id: "1",
        name: email.split("@")[0],
        email,
        authMethod: "email" as const,
      };
      const token = "mock-jwt-token";
      return { success: true, user, token };
    }
    return { success: false, message: "Invalid OTP" };
  },

  googleAuth: async () => {
    // Simulate Google auth
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const user = {
      id: "2",
      name: "Jonas Kahnwald",
      email: "jonas.kahnwald@gmail.com",
      authMethod: "google" as const,
    };
    const token = "mock-jwt-token-google";
    return { success: true, user, token };
  },

  getNotes: async (token: string) => {
    // Simulate fetching notes
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [
      {
        id: "1",
        title: "Note 1",
        content: "This is my first note",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        title: "Note 2",
        content: "This is my second note",
        createdAt: new Date().toISOString(),
      },
    ];
  },

  createNote: async (token: string, title: string, content: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      id: Date.now().toString(),
      title,
      content,
      createdAt: new Date().toISOString(),
    };
  },

  deleteNote: async (token: string, noteId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true };
  },
};

const NoteApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<
    "signup" | "login" | "dashboard"
  >("signup");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    otp: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "" });

  const [generatedOtp, setGeneratedOtp] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setCurrentView("dashboard");
      loadNotes(storedToken);
    }
  }, []);

  const loadNotes = async (authToken: string) => {
    try {
      const fetchedNotes = await mockAPI.getNotes(authToken);
      setNotes(fetchedNotes);
    } catch (err) {
      setError("Failed to load notes");
    }
  };

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
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setOtpSent(true);
      alert(`OTP sent to ${email}`);
    } else {
      console.error(data.error);
      alert(data.message);
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

      } else {
        setError("Invalid OTP");
      }
    } catch (err) {
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await mockAPI.googleAuth();
      if (response.success) {
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        setCurrentView("dashboard");
        await loadNotes(response.token);
      }
    } catch (err) {
      setError("Failed to authenticate with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      setError("Please fill in both title and content");
      return;
    }

    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const note = await mockAPI.createNote(
        token,
        newNote.title,
        newNote.content
      );
      setNotes((prev) => [note, ...prev]);
      setNewNote({ title: "", content: "" });
      setShowCreateNote(false);
    } catch (err) {
      setError("Failed to create note");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!token) return;

    setLoading(true);

    try {
      await mockAPI.deleteNote(token, noteId);
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
    } catch (err) {
      setError("Failed to delete note");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setNotes([]);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentView("signup");
    setFormData({ name: "", email: "", dateOfBirth: "", otp: "" });
    setOtpSent(false);
    setError(null);
  };

  if (currentView === "dashboard" && user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">HD</span>
              </div>
              <span className="font-semibold text-gray-800">Dashboard</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-blue-500 hover:text-blue-600 flex items-center space-x-1"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome, {user.name}!
            </h1>
            <div className="flex items-center space-x-2 text-gray-600">
              <User size={16} />
              <span>Email: {user.email}</span>
            </div>
          </div>

          {/* Create Note Button */}
          <button
            onClick={() => setShowCreateNote(true)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 mb-6 transition-colors"
          >
            <Plus size={20} />
            <span>Create Note</span>
          </button>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Notes Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Notes</h2>
            {notes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No notes yet. Create your first note!
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white rounded-lg shadow-sm p-4 border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">
                      {note.title}
                    </h3>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-500 hover:text-red-600 p-1"
                      disabled={loading}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{note.content}</p>
                  <p className="text-xs text-gray-400">
                    Created: {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Note Modal */}
        {showCreateNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <h2 className="text-xl font-semibold mb-4">Create New Note</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newNote.title}
                    onChange={(e) =>
                      setNewNote((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Enter note title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={newNote.content}
                    onChange={(e) =>
                      setNewNote((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 h-32 resize-none"
                    placeholder="Enter note content"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateNote}
                    disabled={loading}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
                  >
                    {loading ? "Creating..." : "Create Note"}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateNote(false);
                      setNewNote({ title: "", content: "" });
                      setError(null);
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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