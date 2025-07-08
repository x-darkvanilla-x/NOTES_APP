import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: any, res: any) {
  const token = req.headers.authorization?.split(" ")[1];
  const method = req.method;

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decoded = verifyToken(token);
  if (typeof decoded === 'object' && !decoded?.email) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  const email = typeof decoded === 'object' ? decoded.email : '';

  try {
    const client = await clientPromise;
    const db = client.db("notes-app");
    const notesCollection = db.collection("notes");

    if (method === "GET") {
      const notes = await notesCollection
        .find({ email })
        .sort({ createdAt: -1 }) // newest first
        .toArray();

      return res.status(200).json({ success: true, notes });
    }

    if (method === "POST") {
      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ success: false, message: "Title and content required" });
      }

      const newNote = {
        email,
        title,
        content,
        createdAt: new Date(),
      };

      await notesCollection.insertOne(newNote);
      return res.status(201).json({ success: true, message: "Note saved" });
    }

    return res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (error) {
    console.error("Notes API error:", error);
    return res.status(500).json({ success: false, message: "Server error", error });
  }
}
