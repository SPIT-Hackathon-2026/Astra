import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('❌ Auth: Missing email or password');
          throw new Error('Please enter email and password');
        }

        try {
          await dbConnect();
          console.log('✅ Auth: DB connected');

          const user = await User.findOne({
            email: credentials.email.toLowerCase(),
          }).select('+password').lean();

          if (!user) {
            console.error('❌ Auth: No user found for', credentials.email);
            throw new Error('Invalid email or password');
          }
          console.log('✅ Auth: User found:', user.email);

          if (!user.password) {
            console.error('❌ Auth: User has no password field (select might have failed)');
            throw new Error('Invalid email or password');
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValid) {
            console.error('❌ Auth: Password mismatch for', user.email);
            throw new Error('Invalid email or password');
          }

          console.log('✅ Auth: Login successful for', user.email);
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
          };
        } catch (error: any) {
          console.error('❌ Auth error:', error.message);
          throw new Error(error.message || 'Authentication failed');
        }
      }
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };