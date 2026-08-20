import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        npk: { label: 'NPK', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.npk || !credentials?.password) return null;

        const cleanNpk = credentials.npk.trim();
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { npk: cleanNpk },
              { npk: cleanNpk.toLowerCase() },
              { npk: cleanNpk.toUpperCase() }
            ]
          },
        });

        if (!user || !user.password) return null;

        // Cek status user
        if (user.status === 'PENDING') {
          throw new Error('PENDING');
        }
        if (user.status !== 'ACTIVE') {
          throw new Error('INACTIVE');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        // Complete any APPROVED password reset requests for this user to dismiss sign-in page notifications
        await prisma.passwordResetRequest.updateMany({
          where: { userId: user.id, status: 'APPROVED' },
          data: { status: 'COMPLETED' },
        });

        // Log login
        await prisma.activityLog.create({
          data: {
            action: 'LOGIN',
            title: 'User Login',
            message: `${user.name} (${user.npk}) berhasil login`,
            type: 'info',
            userId: user.id,
            userName: user.name || user.npk,
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          npk: user.npk,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
        token.npk = (user as any).npk;
        token.id = user.id;
        token.loginAt = Date.now();
      } else if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, name: true }
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.name = dbUser.name;
          }
        } catch (error) {
          console.error("Error fetching user in jwt callback:", error);
        }
      }
      if (trigger === 'update' && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).npk = token.npk;
        (session.user as any).id = token.id;
        (session.user as any).loginAt = token.loginAt;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'dept-monitor-secret-key-12345',
};
