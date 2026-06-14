import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { Provider } from 'react-redux';

import { App } from './App';
import { SplashScreen } from './components/ui/SplashScreen';
import { auth } from './firebase/firebase';
import { LoginPage } from './pages/LoginPage';
import { HttpRepository } from './repositories/HttpRepository';
import { createStore } from './store';

type AppState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'error' }
  | { status: 'ready'; store: ReturnType<typeof createStore> };

export function Root() {
  const [appState, setAppState] = useState<AppState>({ status: 'loading' });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        setAppState({ status: 'unauthenticated' });
        return;
      }
      try {
        const repository = new HttpRepository(user);
        const preloaded = await repository.loadState();
        const store = createStore(repository, preloaded);
        setAppState({ status: 'ready', store });
      } catch {
        setAppState({ status: 'error' });
      }
    });
  }, []);

  if (appState.status === 'loading') return <SplashScreen />;
  if (appState.status === 'unauthenticated') return <LoginPage />;
  if (appState.status === 'error')
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm text-red-400">
          Failed to load your boards. Please refresh and try again.
        </p>
      </div>
    );
  return (
    <Provider store={appState.store}>
      <App />
    </Provider>
  );
}
