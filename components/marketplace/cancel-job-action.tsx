"use client";

import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function CancelJobAction({ jobId }: { jobId: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="customer-open-job-delete"
          aria-label="Cancel job"
        >
          <Trash2 aria-hidden="true" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this job?</AlertDialogTitle>
          <AlertDialogDescription>
            Cleaners will no longer be able to send offers. Existing job and offer records will not
            be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={`/customer/jobs/${jobId}/cancel`} method="post">
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Keep job</AlertDialogCancel>
            <button type="submit" className="button button--danger">
              Cancel job
            </button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
