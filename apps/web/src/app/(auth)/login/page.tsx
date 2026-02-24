'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TBox } from '@/components/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const sbRef = useRef<any>(null);

  useEffect(() => {
    import('@supabase/auth-helpers-nextjs').then(({ createClientComponentClient }) => {
      sbRef.current = createClientComponentClient();
    });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!sbRef.current) return;
    setError('');
    setLoading(true);

    const { error } = await sbRef.current.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push('/dashboard');
  }

  async function handleOAuth(provider: 'github') {
    if (!sbRef.current) return;
    await sbRef.current.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="max-w-[380px] mx-auto pt-20">
      <div className="text-center mb-8">
        <span className="text-accent text-2xl">◈</span>
        <h1 className="text-xl font-bold text-bright mt-2 mb-1">Welcome back</h1>
        <p className="text-[11px] text-dim">Sign in to your OpenClawScan dashboard</p>
      </div>

      <TBox title="LOGIN" color="#22c55e">
        <div className="space-y-3">
          <button
            onClick={() => handleOAuth('github')}
            className="w-full py-2.5 text-[11px] font-bold text-bright bg-faint border border-ghost/30 hover:border-ghost transition-colors"
          >
            Continue with GitHub
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-faint" />
            <span className="text-[9px] text-ghost">OR</span>
            <div className="flex-1 h-px bg-faint" />
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="text-[9px] text-ghost tracking-widest block mb-1">EMAIL</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-bg border border-faint px-3 py-2 text-[12px] text-tx focus:border-accent/40 outline-none transition-colors"
                placeholder="you@example.com" required
              />
            </div>
            <div>
              <label className="text-[9px] text-ghost tracking-widest block mb-1">PASSWORD</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-bg border border-faint px-3 py-2 text-[12px] text-tx focus:border-accent/40 outline-none transition-colors"
                placeholder="••••••••" required
              />
            </div>

            {error && <p className="text-[10px] text-c-red">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 bg-accent text-black text-[11px] font-bold disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'SIGN IN'}
            </button>
          </form>
        </div>
      </TBox>

      <p className="text-center text-[10px] text-ghost mt-4">
        Don't have an account?{' '}
        <Link href="/signup" className="text-accent hover:underline">Sign up</Link>
      </p>
    </div>
  );
}
