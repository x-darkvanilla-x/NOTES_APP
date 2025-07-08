import clientPromise from "@/lib/mongodb";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default async function handler(
  req: { body: { email: string; otp: string; mode: string } },
  res: { status: (code: number) => { json: (data: any) => any } }
) {
  const { email, otp, mode } = req.body;

  if (!email || !otp || !mode) {
    return res.status(400).json({
      success: false,
      message: "Email, OTP, and mode are required",
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db("notes-app");
    const users = db.collection("users");

    const existingUser = await users.findOne({ email });

    // ✅ Handle based on mode
    if (mode === "signup" && existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered. Please sign in instead.",
      });
    }

    if (mode === "signin" && !existingUser) {
      return res.status(404).json({
        success: false,
        message: "Email not found. Please sign up first.",
      });
    }

    // ✅ Send OTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      html: `<p>Your OTP is <strong>${otp}</strong></p>`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again later.",
      error,
    });
  }
}
