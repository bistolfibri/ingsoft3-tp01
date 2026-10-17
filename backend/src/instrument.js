import * as Sentry from '@sentry/node';

// Si SENTRY_DSN no está definida (local, tests, QA), Sentry queda apagado y la app anda igual.
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0, // medir todos los pedidos (sirve para ver tiempos)
});
