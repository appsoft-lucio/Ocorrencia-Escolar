import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: "none" })
      .then((registration) => {
        const notify = () => {
          if (registration.waiting) window.dispatchEvent(new Event("app-update-ready"));
        };
        notify();
        registration.addEventListener("updatefound", () => {
          registration.installing?.addEventListener("statechange", notify);
        });
        let applying = false;
        window.addEventListener("app-apply-update", () => {
          applying = true;
          registration.waiting?.postMessage({ type: "SKIP_WAITING" });
        });
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (applying) window.location.reload();
        });
        const check = () => {
          if (navigator.onLine) registration.update().then(notify).catch(() => {});
        };
        window.addEventListener("online", check);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") check();
        });
        setInterval(check, 60000);
        check();
      })
      .catch((error) => console.error("Falha ao atualizar o aplicativo:", error))
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
