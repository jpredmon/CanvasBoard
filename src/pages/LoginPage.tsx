import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { auth } from '../firebase/firebase';

export function LoginPage() {
  async function handleSignIn() {
    await signInWithPopup(auth, new GoogleAuthProvider());
  }

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-xl font-semibold text-white">CanvasBoard</h1>
        <button
          onClick={handleSignIn}
          className="rounded bg-violet-600 px-6 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
