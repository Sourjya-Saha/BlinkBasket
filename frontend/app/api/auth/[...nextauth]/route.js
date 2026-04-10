import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// NOTE: No GoogleProvider here — Google OAuth is handled entirely by Supabase.
// After Supabase completes the OAuth flow, the frontend calls /api/auth/google
// on our Express backend (which upserts the user), then signs into NextAuth
// using the returned token via the 'supabase-google' credentials provider.

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const authOptions = {
  providers: [
    // ── 1. Email + Password ──────────────────────────────────────
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email:    credentials.email,
            password: credentials.password,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.token) {
          throw new Error(data.error || 'Invalid email or password');
        }

        return {
          id:          data.user.id,
          email:       data.user.email,
          role:        data.user.role,  // 'user' | 'admin'
          accessToken: data.token,
          provider:    'local',
        };
      },
    }),

    // ── 2. Supabase Google (post-OAuth) ──────────────────────────
    // Flow:
    //   a) User clicks "Continue with Google"
    //   b) Client calls supabase.auth.signInWithOAuth({ provider: 'google' })
    //   c) Supabase redirects back with session; client extracts email + full_name
    //   d) Client POSTs to /api/auth/google → gets { token, user }
    //   e) Client calls signIn('supabase-google', { ...data }) → NextAuth session
    CredentialsProvider({
      id: 'supabase-google',
      name: 'Supabase Google',
      credentials: {
        email:       { label: 'Email',        type: 'email' },
        full_name:   { label: 'Full Name',    type: 'text'  },
        userId:      { label: 'User ID',      type: 'text'  },
        role:        { label: 'Role',         type: 'text'  },
        accessToken: { label: 'Access Token', type: 'text'  },
      },
      async authorize(credentials) {
        if (!credentials?.accessToken || !credentials?.email) {
          throw new Error('Missing Google auth credentials');
        }

        return {
          id:          credentials.userId,
          email:       credentials.email,
          name:        credentials.full_name || '',
          role:        credentials.role || 'user',
          accessToken: credentials.accessToken,
          provider:    'google',
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id          = user.id;
        token.email       = user.email;
        token.name        = user.name;
        token.role        = user.role;
        token.accessToken = user.accessToken;
        token.provider    = user.provider;
      }

      if (trigger === 'update' && session) {
        token.name  = session.name  ?? token.name;
        token.email = session.email ?? token.email;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id       = token.id;
      session.user.email    = token.email;
      session.user.name     = token.name;
      session.user.role     = token.role;
      session.user.provider = token.provider;
      session.accessToken   = token.accessToken;
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: {
    signIn: '/auth/logincommon',
    error:  '/auth/logincommon',
  },

  session: {
    strategy: 'jwt',
    maxAge:   7 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug:  process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };