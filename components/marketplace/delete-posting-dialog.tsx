"use client";

import { AlertDialog } from "radix-ui";
import { Trash2 } from "lucide-react";
import { getPostingDeletion } from "@/lib/job-activity";
import styles from "./delete-posting-dialog.module.css";

type Posting = { id: string; status: string; addressLine1: string; postalCode: string };

export function DeletePostingDialog({ job, pending, error, onCancel, onConfirm, onRestoreFocus }: {
  job: Posting | null;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  onRestoreFocus: (id: string) => void;
}) {
  if (!job) return null;
  const deletion = getPostingDeletion(job);
  return (
    <AlertDialog.Root open onOpenChange={(open) => { if (!open && !pending) onCancel(); }}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={styles.overlay} />
        <AlertDialog.Content className={styles.dialog} aria-busy={pending}
          onEscapeKeyDown={(event) => { if (pending) event.preventDefault(); }}
          onCloseAutoFocus={(event) => { event.preventDefault(); onRestoreFocus(job.id); }}>
          <span className={styles.icon}><Trash2 aria-hidden="true" /></span>
          <AlertDialog.Title className={styles.title}>{deletion.title}</AlertDialog.Title>
          <p className={styles.address}>{job.addressLine1 || `ZIP ${job.postalCode}`}</p>
          <AlertDialog.Description className={styles.description}>{deletion.description}</AlertDialog.Description>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.actions}>
            <AlertDialog.Cancel asChild><button type="button" className={styles.keep} disabled={pending}>Keep job</button></AlertDialog.Cancel>
            <button type="button" className={styles.confirm} disabled={pending} onClick={onConfirm}>{pending ? "Deleting…" : deletion.action}</button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
