import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: any, res: any) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded || typeof decoded === 'string' || !decoded.email) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("notes-app");
    const user = await db.collection("users").findOne({ email: decoded.email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { name, dob, email } = user;
    res.status(200).json({ success: true, user: { name, dob, email } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
}
