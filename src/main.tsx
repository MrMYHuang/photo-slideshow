import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { serviceWorkCallbacks } from './App';
import * as serviceWorker from './serviceWorkerRegistration';
import Globals from './Globals';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register({
  onLoad: (registration: ServiceWorkerRegistration) => {
      Globals.setServiceWorkerReg(registration);
      console.log('ServiceWorkerRegistration loaded!');
  },
  onSuccess: (registration: ServiceWorkerRegistration) => {
      Globals.setServiceWorkerReg(registration);
      serviceWorkCallbacks.onSuccess(registration);
      console.log('Precache app loaded!');
  },
  onUpdate: (registration: ServiceWorkerRegistration) => {
      Globals.setServiceWorkerRegUpdated(registration);
      serviceWorkCallbacks.onUpdate(registration);
      console.log('Found app updated!');
  },
});