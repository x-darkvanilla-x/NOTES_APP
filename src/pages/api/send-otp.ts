import nodemailer from "nodemailer";

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });


export default async function handler(req: { body: { email: any; otp: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { success: boolean; error?: unknown; }): void; new(): any; }; }; }) {
  const { email, otp } = req.body;

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

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
}
