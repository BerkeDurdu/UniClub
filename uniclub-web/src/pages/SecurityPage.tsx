import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  confirmTotp,
  disableEmail,
  disableTotp,
  enableEmail,
  getStatus,
  setupTotp,
  webauthnDelete,
  webauthnRegisterStart,
  webauthnRegisterVerify,
  type TOTPSetup,
} from "../api/services/twoFactorService";
import Button from "../components/common/Button";
import Card from "../components/common/Card";

function b64urlToArrayBuffer(b64: string): ArrayBuffer {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const std = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(std);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

function arrayBufferToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function SecurityPage() {
  const qc = useQueryClient();
  const { data: status, isLoading } = useQuery({ queryKey: ["2fa-status"], queryFn: getStatus });

  const [totpSetup, setTotpSetup] = useState<TOTPSetup | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [keyLabel, setKeyLabel] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["2fa-status"] });

  const setupTotpMutation = useMutation({
    mutationFn: setupTotp,
    onSuccess: setTotpSetup,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed."),
  });

  const confirmTotpMutation = useMutation({
    mutationFn: () => confirmTotp(totpCode.trim()),
    onSuccess: () => { setTotpSetup(null); setTotpCode(""); toast.success("TOTP enabled."); refresh(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed."),
  });

  const disableTotpMutation = useMutation({
    mutationFn: disableTotp,
    onSuccess: () => { toast.success("TOTP disabled."); refresh(); },
  });

  const enableEmailMutation = useMutation({
    mutationFn: enableEmail,
    onSuccess: () => { toast.success("Email OTP enabled."); refresh(); },
  });

  const disableEmailMutation = useMutation({
    mutationFn: disableEmail,
    onSuccess: () => { toast.success("Email OTP disabled."); refresh(); },
  });

  const addKeyMutation = useMutation({
    mutationFn: async () => {
      const opts = await webauthnRegisterStart();
      const cred = (await navigator.credentials.create({
        publicKey: {
          challenge: b64urlToArrayBuffer(opts.challenge),
          rp: opts.rp,
          user: {
            id: b64urlToArrayBuffer(opts.user.id),
            name: opts.user.name,
            displayName: opts.user.displayName,
          },
          pubKeyCredParams: opts.pubKeyCredParams,
          authenticatorSelection: opts.authenticatorSelection as AuthenticatorSelectionCriteria,
          timeout: opts.timeout,
        },
      })) as PublicKeyCredential | null;
      if (!cred) throw new Error("Cancelled");
      const credentialId = arrayBufferToB64url(cred.rawId);
      const response = cred.response as AuthenticatorAttestationResponse;
      const publicKey = arrayBufferToB64url(response.getPublicKey() ?? new ArrayBuffer(0));
      return webauthnRegisterVerify({
        challenge: opts.challenge,
        credential_id: credentialId,
        public_key: publicKey,
        label: keyLabel || "Security key",
      });
    },
    onSuccess: () => { setKeyLabel(""); toast.success("Security key added."); refresh(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "WebAuthn failed."),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: webauthnDelete,
    onSuccess: () => { toast.success("Removed."); refresh(); },
  });

  if (isLoading || !status) {
    return <p className="text-slate">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="headline text-3xl font-bold text-ink">Security</h1>

      <Card>
        <h2 className="text-lg font-semibold text-ink">Authenticator app (TOTP)</h2>
        <p className="mt-1 text-sm text-slate">Status: {status.totp ? "Enabled" : "Disabled"}</p>

        {!status.totp && !totpSetup ? (
          <Button className="mt-3" onClick={() => setupTotpMutation.mutate()} isLoading={setupTotpMutation.isPending}>
            Set up TOTP
          </Button>
        ) : null}

        {totpSetup ? (
          <div className="mt-4 space-y-3">
            <img src={`data:image/png;base64,${totpSetup.qr_png_base64}`} alt="QR" className="h-48 w-48" />
            <p className="text-xs text-slate">Manual key: <code>{totpSetup.secret}</code></p>
            <input
              inputMode="numeric"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder="6-digit code"
              className="w-full rounded-lg border border-slate/30 px-3 py-2 tracking-widest"
            />
            <Button onClick={() => confirmTotpMutation.mutate()} isLoading={confirmTotpMutation.isPending}>
              Confirm
            </Button>
          </div>
        ) : null}

        {status.totp ? (
          <Button className="mt-3" variant="ghost" onClick={() => disableTotpMutation.mutate()}>
            Disable TOTP
          </Button>
        ) : null}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-ink">Email OTP</h2>
        <p className="mt-1 text-sm text-slate">Status: {status.email ? "Enabled" : "Disabled"}</p>
        {status.email ? (
          <Button className="mt-3" variant="ghost" onClick={() => disableEmailMutation.mutate()}>
            Disable email OTP
          </Button>
        ) : (
          <Button className="mt-3" onClick={() => enableEmailMutation.mutate()}>
            Enable email OTP
          </Button>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-ink">Security keys / Passkeys (WebAuthn)</h2>
        <ul className="mt-3 space-y-2">
          {status.webauthn_credentials.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded border border-slate/20 px-3 py-2 text-sm">
              <span>{c.label} <span className="text-xs text-slate">({new Date(c.created_at).toLocaleDateString()})</span></span>
              <button className="text-xs text-red-600 underline" onClick={() => deleteKeyMutation.mutate(c.id)}>
                Remove
              </button>
            </li>
          ))}
          {status.webauthn_credentials.length === 0 ? (
            <li className="text-sm text-slate">No security keys yet.</li>
          ) : null}
        </ul>
        <div className="mt-4 flex gap-2">
          <input
            value={keyLabel}
            onChange={(e) => setKeyLabel(e.target.value)}
            placeholder="Label (e.g. YubiKey)"
            className="flex-1 rounded-lg border border-slate/30 px-3 py-2"
          />
          <Button onClick={() => addKeyMutation.mutate()} isLoading={addKeyMutation.isPending}>
            Add device
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default SecurityPage;
