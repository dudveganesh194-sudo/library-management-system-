/**
 * LibraryCredentialsDialog — shows owner login credentials after library creation.
 *
 * Displayed after successful library creation with copy-to-clipboard functionality.
 */

import { useState } from 'react';
import { Copy, Check, KeyRound } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import type { CreateLibraryCredentials } from '../../../types';

interface LibraryCredentialsDialogProps {
  open: boolean;
  onClose: () => void;
  credentials: CreateLibraryCredentials | null;
}

export function LibraryCredentialsDialog({ open, onClose, credentials }: LibraryCredentialsDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!credentials) return null;

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAll = async () => {
    const text = `Library: ${credentials.libraryName}\nOwner: ${credentials.ownerName}\nEmail: ${credentials.email}\nPassword: ${credentials.password}`;
    await navigator.clipboard.writeText(text);
    setCopiedField('all');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Modal open={open} onClose={onClose} title="Library Created — Owner Credentials" size="md">
      <div className="space-y-5">
        {/* Success header */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="p-2 rounded-full bg-emerald-500/20">
            <KeyRound className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              Library "{credentials.libraryName}" created!
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Share these credentials with the library owner.
            </p>
          </div>
        </div>

        {/* Credentials */}
        <div className="space-y-3">
          <CredentialRow
            label="Library Name"
            value={credentials.libraryName}
            onCopy={() => copyToClipboard(credentials.libraryName, 'libraryName')}
            copied={copiedField === 'libraryName'}
          />
          <CredentialRow
            label="Owner Name"
            value={credentials.ownerName}
            onCopy={() => copyToClipboard(credentials.ownerName, 'ownerName')}
            copied={copiedField === 'ownerName'}
          />
          <CredentialRow
            label="Login Email"
            value={credentials.email}
            onCopy={() => copyToClipboard(credentials.email, 'email')}
            copied={copiedField === 'email'}
          />
          <CredentialRow
            label="Password"
            value={credentials.password}
            onCopy={() => copyToClipboard(credentials.password, 'password')}
            copied={copiedField === 'password'}
            isSensitive
          />
        </div>

        {/* Warning */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            ⚠️ This password won't be shown again. Please save or share it now.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={copyAll}>
            {copiedField === 'all' ? (
              <><Check className="w-4 h-4" /> Copied All</>
            ) : (
              <><Copy className="w-4 h-4" /> Copy All</>
            )}
          </Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Credential Row ───────────────────────────────────────────────────────────

function CredentialRow({
  label,
  value,
  onCopy,
  copied,
  isSensitive,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  isSensitive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-surface-1 dark:bg-surface-3 border border-border">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-mono font-medium text-foreground truncate ${isSensitive ? 'select-all' : ''}`}>
          {value}
        </p>
      </div>
      <button
        onClick={onCopy}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-200 dark:hover:bg-surface-4 transition-colors shrink-0 ml-2"
        title="Copy"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}
