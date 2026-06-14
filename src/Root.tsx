import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';

import { App } from './App';
import { SplashScreen } from './components/ui/SplashScreen';
import { auth } from './firebase/firebase';
import { LoginPage } from './pages/LoginPage';
import { LocalStorageRepository } from './repositories/LocalStorageRepository';
import { createStore } from './store';

type AppState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'ready'; store: ReturnType<typeof createStore> };

export function Root() {
  const [appState, setAppState] = useState<AppState>({ status: 'loading' });

  useEffect(() => {
    return onAuthStateChanged(auth, (user: User | null) => {
      if (!user) {
        setAppState({ status: 'unauthenticated' });
        return;
      }
      const repository = new LocalStorageRepository();
      const store = createStore(repository);
      setAppState({ status: 'ready', store });
    });
  }, []);

  if (appState.status === 'loading') return <SplashScreen />;
  if (appState.status === 'unauthenticated') return <LoginPage />;
  return (
    <Provider store={appState.store}>
      <App />
    </Provider>
  );
}
