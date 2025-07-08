"use client";

import { Trash2, Plus, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useSession } from "next-auth/react";
import { signToken } from "@/lib/jwt";

interface User {
  id: string;
  name: string;
  email: string;
  authMethod: "email" | "google";
  image: string;
}

interface Note {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  const fetchNotes = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch("/api/notes", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (data.success) {
      setNotes(data.notes); // store in state
    } else {
      localStorage.removeItem("token");
      router.push("/");
    }
  };

  const handleCreateNote = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: newNote.title,
        content: newNote.content,
      }),
    });

    const data = await res.json();
    if (data.success) {
      setNewNote({ title: "", content: "" });
      setShowCreateNote(false);
      fetchNotes();
    } else {
      localStorage.removeItem("token");
      router.push("/");
    }
  };

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }

  const fetchUser = async () => {
    // Case 1: Google login (next-auth)
    if (session?.user?.email) {
      const res = await fetch("/api/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: session.user.email }),
      });

      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem("token", data.token);
      } else {
        router.push("/");
      }
      return;
    }

    // Case 2: Email login (JWT from localStorage)
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/");
      return;
    }

    const res = await fetch("/api/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (data.success) {
      setUser(data.user);
    } else {
      localStorage.removeItem("token");
      router.push("/");
    }
  };

  useEffect(() => {
    if (status !== "loading") {
      fetchUser();
    }
  }, [status]);

  const deleteNote = async (noteId: string) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`/api/notes/${noteId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (data.success) {
      fetchNotes();
    } else {
      localStorage.removeItem("token");
      router.push("/");
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {user &&
              (user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {getInitials(user.name)}
                  </span>
                </div>
              ))}
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

      <div className="max-w-4xl mx-auto px-4 py-6">
        {user && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome, {user.name}
            </h1>
            <div className="flex items-center space-x-2 text-gray-600">
              <User size={16} />
              <span>Email: {user.email} </span>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            setShowCreateNote(true);
          }}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 mb-6 transition-colors"
        >
          <Plus size={20} />
          <span>Create Note</span>
        </button>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Notes</h2>
          {notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No notes yet. Create your first note!
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note._id}
                className="bg-white rounded-lg shadow-sm p-4 border"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{note.title}</h3>
                  <button
                    onClick={() => deleteNote(note._id)}
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