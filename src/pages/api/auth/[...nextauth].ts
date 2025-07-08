import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "@/lib/mongodb";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const client = await clientPromise;
      const db = client.db("notes-app");
      const users = db.collection("users");

      const existing = await users.findOne({ email: user.email });

      if (!existing) {
        // Store new Google user
        await users.insertOne({
          name: user.name,
          email: user.email,
          image: user.image,
          dob: null, // set to null and prompt later
          createdAt: new Date(),
        });
      }

      return true; // allow sign-in
    },

    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.email = profile.email;
        token.name = profile.name;
        token.picture = profile.image;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.picture;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
