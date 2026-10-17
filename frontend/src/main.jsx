import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import * as Sentry from '@sentry/react';
//dsn es a dónde se mandan los datos
//environment: la etiqueta del sitio de origen.
//browserTracingIntegration(): lo que mide los tiempos de carga y de los pedidos a la API.
//tracesSampleRate: 1.0: mide todos los pedidos, no una muestra.

Sentry.init({
  dsn: 'https://bef840d4724fbc035f8c4aed2ffc6c02@o4512273910661120.ingest.us.sentry.io/4512273931370496',
  environment: window.location.hostname, // de qué sitio viene: producción, QA o localhost
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0, // medir todos los pedidos
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);