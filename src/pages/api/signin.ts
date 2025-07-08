import clientPromise from "@/lib/mongodb";
import { signToken } from "@/lib/jwt";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("notes-app");
    const users = db.collection("users");

    const user = await users.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const token = signToken({ email });

    res.status(200).json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, message: "Signin failed", error });
  }
}
