import { useMemo, useState } from "react";
import { Cloud, CloudUpload, CloudDownload, LogIn, LogOut, UserPlus } from "lucide-react";
import {
  isCloudConfigured,
  getCloudSession,
  signInWithEmail,
  signUpWithEmail,
  signOutCloud,
  uploadCloudPayload,
  downloadCloudPayload,
} from "../utils/cloudSync";
import { getCloudPayload, importCloudPayload } from "../utils/storage";

export default function CloudSyncPanel({ onDataImported }) {
  const [session, setSession] = useState(getCloudSession());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [mergeOnImport, setMergeOnImport] = useState(true);

  const configured = useMemo(() => isCloudConfigured(), []);

  const executeAuth = async (type) => {
    try {
      setIsBusy(true);
      setStatus("");
      const next = type === "signup" ? await signUpWithEmail(email, password) : await signInWithEmail(email, password);
      setSession(next?.access_token ? next : getCloudSession());
      setStatus(type === "signup" ? "Account created. Signed in." : "Signed in.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleUpload = async () => {
    try {
      setIsBusy(true);
      setStatus("");
      await uploadCloudPayload(getCloudPayload());
      setStatus("Cloud backup uploaded.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsBusy(true);
      setStatus("");
      const snapshot = await downloadCloudPayload();
      if (!snapshot) {
        setStatus("No cloud backup found.");
        return;
      }

      importCloudPayload(snapshot.payload, { merge: mergeOnImport });
      if (typeof onDataImported === "function") onDataImported();
      setStatus(`Cloud backup imported (${mergeOnImport ? "merged" : "replaced"}).`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsBusy(false);
    }
  };

  if (!configured) {
    return (
      <div className="w-full mx-auto panel-card rounded-2xl p-5 mb-6 pt-10">
        <div className="flex items-center gap-2 mb-2 text-[var(--chrono-secondary)]">
          <Cloud size={17} />
          <h3 className="section-title">Cloud Sync & Auth</h3>
        </div>
        <p className="text-sm text-gray-600">
          Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable account login and cloud sync.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto panel-card rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-3 text-[var(--chrono-secondary)]">
        <Cloud size={17} />
        <h3 className="section-title">Cloud Sync & Auth</h3>
      </div>

      {!session && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field-input"
          />
          <div className="flex gap-2">
            <button
              onClick={() => executeAuth("signin")}
              disabled={isBusy || !email || !password}
              className="action-btn-secondary text-xs disabled:opacity-50"
            >
              <LogIn size={14} /> Sign In
            </button>
            <button
              onClick={() => executeAuth("signup")}
              disabled={isBusy || !email || !password}
              className="action-btn text-xs disabled:opacity-50"
            >
              <UserPlus size={14} /> Sign Up
            </button>
          </div>
        </div>
      )}

      {session && (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">Signed in as <span className="font-medium">{session.user?.email}</span></p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleUpload}
              disabled={isBusy}
              className="action-btn text-xs disabled:opacity-50"
            >
              <CloudUpload size={14} /> Upload Backup
            </button>
            <button
              onClick={handleDownload}
              disabled={isBusy}
              className="action-btn-secondary text-xs disabled:opacity-50"
            >
              <CloudDownload size={14} /> Download Backup
            </button>
            <button
              onClick={() => {
                signOutCloud();
                setSession(null);
                setStatus("Signed out.");
              }}
              className="action-btn-secondary text-xs"
            >
              <LogOut size={14} /> Sign Out
            </button>
            <label className="text-xs font-semibold text-gray-700 inline-flex items-center gap-1">
              <input
                type="checkbox"
                checked={mergeOnImport}
                onChange={(event) => setMergeOnImport(event.target.checked)}
                className="accent-[var(--chrono-primary)]"
              />
              Merge on import
            </label>
          </div>
        </div>
      )}

      {status && <p className="text-sm mt-3 text-[var(--chrono-secondary)]">{status}</p>}
    </div>
  );
}
