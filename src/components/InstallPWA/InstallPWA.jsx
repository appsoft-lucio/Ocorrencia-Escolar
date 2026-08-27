import { useEffect, useState } from "react";
import "./InstallPWA.css";

function InstallPWA() {
  const [installEvent, setInstallEvent] = useState(null);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (isStandalone) return undefined;

    if (/iphone|ipad|ipod/i.test(window.navigator.userAgent)) setShowIosHelp(true);

    const handleInstallAvailable = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const handleInstalled = () => {
      setInstallEvent(null);
      setShowIosHelp(false);
    };

    window.addEventListener("beforeinstallprompt", handleInstallAvailable);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallAvailable);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  if (!installEvent && !showIosHelp) return null;

  return (
    <aside className="install-pwa" aria-label="Instalar aplicativo">
      <button className="install-pwa-close" type="button" onClick={() => { setInstallEvent(null); setShowIosHelp(false); }} aria-label="Fechar">×</button>
      <strong>Instale o EduRegistro</strong>
      {installEvent ? (
        <>
          <span>Acesse mais rápido pelo computador ou celular.</span>
          <button className="install-pwa-action" type="button" onClick={install}>Instalar aplicativo</button>
        </>
      ) : (
        <span>No iPhone, toque em Compartilhar e depois em “Adicionar à Tela de Início”.</span>
      )}
    </aside>
  );
}

export default InstallPWA;
