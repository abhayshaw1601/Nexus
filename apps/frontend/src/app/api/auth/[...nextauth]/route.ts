import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            email: credentials?.email,
            password: credentials?.password,
          });

          if (res.data && res.data.user) {
            return {
              ...res.data.user,
              accessToken: res.data.token,
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Handle session updates
      if (trigger === "update" && session) {
        if (session.status) token.status = session.status;
        if (session.specialization) token.specialization = session.specialization;
      }

      if (user) {
        token.accessToken = (user as any).accessToken;
        token.role = (user as any).role;
        token.id = (user as any).id;
        token.status = (user as any).status;
        token.specialization = (user as any).specialization;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).status = token.status;
        (session.user as any).specialization = token.specialization;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
