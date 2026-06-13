import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'

import App from './App'
import { LocalStorageRepository } from './repositories/LocalStorageRepository'
import { createStore } from './store'

const repository = new LocalStorageRepository()
const store = createStore(repository)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
)
