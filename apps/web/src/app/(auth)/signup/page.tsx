'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { TBox } from '@/components/ui';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const sbRef = useRef<any>(null);

  useEffect(() => {
    import('@supabase/auth-helpers-nextjs').then(({ createClientComponentClient }) => {
      sbRef.current = createClientComponentClient();
    });
  }, []);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!sbRef.current) return;
    setError('');
    setLoading(true);

    const { error } = await sbRef.current.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  }

  async function handleOAuth(provider: 'github' | 'google') {
    if (!sbRef.current) return;
    await sbRef.current.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (success) {
    return (
      <div className="max-w-[380px] mx-auto pt-20">
        <TBox title="CHECK YOUR EMAIL" color="#22c55e">
          <div className="text-center py-4">
            <span className="text-2xl text-accent block mb-3">✓</span>
            <p className="text-[12px] text-bright mb-2">Confirmation email sent</p>
            <p className="text-[10px] text-dim">Click the link in your email to activate your account.</p>
          </div>
        </TBox>
      </div>
    );
  }

  return (
    <div className="max-w-[380px] mx-auto pt-20">
      <div className="text-center mb-8">
        <span className="text-accent text-2xl">◈</span>
        <h1 className="text-xl font-bold text-bright mt-2 mb-1">Create account</h1>
        <p className="text-[11px] text-dim">Start verifying your agent's actions</p>
      </div>

      <TBox title="SIGN UP" color="#22c55e">
        <div className="space-y-3">
          <button onClick={() => handleOAuth('github')} className="w-full py-2.5 text-[11px] font-bold text-bright bg-faint border border-ghost/30 hover:border-ghost transition-colors">
            Continue with GitHub
          </button>
          <button onClick={() => handleOAuth('google')} className="w-full py-2.5 text-[11px] font-bold text-bright bg-faint border border-ghost/30 hover:border-ghost transition-colors">
            Continue with Google
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-faint" />
            <span className="text-[9px] text-ghost">OR</span>
            <div className="flex-1 h-px bg-faint" />
          </div>

          <form onSubmit={handleSignup} className="space-y-3">
            <div>
              <label className="text-[9px] text-ghost tracking-widest block mb-1">DISPLAY NAME</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-bg border border-faint px-3 py-2 text-[12px] text-tx focus:border-accent/40 outline-none" placeholder="Your name" required />
            </div>
            <div>
              <label className="text-[9px] text-ghost tracking-widest block mb-1">EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-bg border border-faint px-3 py-2 text-[12px] text-tx focus:border-accent/40 outline-none" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="text-[9px] text-ghost tracking-widest block mb-1">PASSWORD</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-bg border border-faint px-3 py-2 text-[12px] text-tx focus:border-accent/40 outline-none" placeholder="Min 8 characters" required minLength={8} />
            </div>

            {error && <p className="text-[10px] text-c-red">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-accent text-black text-[11px] font-bold disabled:opacity-50">
              {loading ? 'Creating...' : 'CREATE ACCOUNT'}
            </button>
          </form>
        </div>
      </TBox>

      <p className="text-center text-[10px] text-ghost mt-4">
        Already have an account?{' '}
        <Link href="/login" className="text-accent hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
