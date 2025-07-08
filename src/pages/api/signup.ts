import clientPromise from "@/lib/mongodb";
import { signToken } from "@/lib/jwt";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { name, dob, email } = req.body;

  if (!name || !dob || !email) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("notes-app");
    const users = db.collection("users");

    const existing = await users.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }

    const user = { name, dob, email };
    await users.insertOne({ ...user, createdAt: new Date() });

    const token = signToken({ email });

    res.status(201).json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, message: "Signup failed", error });
  }
}
