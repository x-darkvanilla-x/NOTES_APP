// pages/api/me.ts (or app/api/me/route.ts if using App Router)
import clientPromise from "@/lib/mongodb";
import { signToken, verifyToken } from "@/lib/jwt";

export default async function handler(req: any, res: any) {
  const client = await clientPromise;
  const db = client.db("notes-app");
  const users = db.collection("users");

  // Google login (email sent in body)
  if (req.method === "POST" && req.body.email) {
    const user = await users.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const token = signToken({ email: user.email });
    return res.status(200).json({ success: true, user , token});
  }

  // Email login with token
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token);
    const user = await users.findOne({ email: (decoded as { email: string }).email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}
