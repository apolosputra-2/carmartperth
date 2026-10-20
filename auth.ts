import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const email =
          typeof credentials.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";

        const password =
          typeof credentials.password === "string"
            ? credentials.password
            : "";

        if (!email || !password) return null;

        const user = await prisma.portalUser.findFirst({
          where: {
            email: {
              equals: email,
              mode: "insensitive",
            },
            isActive: true,
          },
        });

        if (!user?.passwordHash) return null;

        const validPassword = await bcrypt.compare(
          password,
          user.passwordHash
        );

        if (!validPassword) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.portalUserId = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (
        session.user &&
        typeof token.portalUserId === "string"
      ) {
        session.user.id = token.portalUserId;
      }

      return session;
    },
  },
});
