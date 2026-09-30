import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { offlineStatus } from "../../services/offlineStore";
import "./OfflineStatus.css";

export default function OfflineStatus() {
  const { user } = useContext(AuthContext);
  const [status, setStatus] = useState({ online: navigator.onLine, pending: 0 });
  const [authError, setAuthError] = useState("");
  const [update, setUpdate] = useState(false);
  useEffect(() => {
    const refresh = () => {
      setStatus({ online: navigator.onLine, ...offlineStatus(user) });
      setAuthError("");
    };
    const failure = (event) => setAuthError(event.detail);
    const available = () => setUpdate(true);
    refresh();
    window.addEventListener("offline-status", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    window.addEventListener("offline-auth-error", failure);
    window.addEventListener("app-update-ready", available);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("offline-status", refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      window.removeEventListener("offline-auth-error", failure);
      window.removeEventListener("app-update-ready", available);
      window.removeEventListener("storage", refresh);
    };
  }, [user]);
  if (user?.origem !== "supabase") return null;
  return <aside className="offline-status" aria-label="Conexão e sincronização">
    <span role="status">{!status.online ? "Off-line — usando dados deste dispositivo" : status.syncing
      ? "Sincronizando…" : status.pending ? "Alterações aguardando envio" : "On-line"}
      {status.pending > 0 && ` · ${status.pending} alteração(ões) pendente(s)`}</span>
    {(authError || status.error) && <span role="alert">{authError || status.error}</span>}
    {(status.pending > 0 || authError || status.error) && status.online &&
      <button type="button" disabled={status.syncing} onClick={() => window.dispatchEvent(new Event("offline-retry"))}>Tentar sincronizar</button>}
    {update && <button type="button" disabled={status.pending > 0 || status.syncing}
      onClick={() => window.dispatchEvent(new Event("app-apply-update"))}>Nova versão disponível — atualizar aplicativo</button>}
  </aside>;
}
