import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: any, res: any) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decoded = verifyToken(token);
  if (typeof decoded === 'object' && !decoded?.email) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  const { id } = req.query;

  try {
    const client = await clientPromise;
    const db = client.db("notes-app");
    const notes = db.collection("notes");

    const note = await notes.findOne({ _id: new ObjectId(id) });

    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    if (note.email !== (decoded as { email: string }).email) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    await notes.deleteOne({ _id: new ObjectId(id) });

    return res.status(200).json({ success: true, message: "Note deleted" });
  } catch (error) {
    console.error("Delete Note Error:", error);
    return res.status(500).json({ success: false, message: "Server error", error });
  }
}
