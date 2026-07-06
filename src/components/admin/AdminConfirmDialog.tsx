import React from 'react';
import { useAdminScrollUnlock } from '@/lib/adminScrollLock';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AdminConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

const AdminConfirmDialog: React.FC<AdminConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = false,
  loading = false,
  onConfirm,
  onOpenChange,
}) => {
  useAdminScrollUnlock(open);

  return (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="admin-dialog-content max-h-[85vh] overflow-y-auto w-[calc(100vw-2rem)] max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
        <AlertDialogCancel disabled={loading} className="min-h-11 touch-manipulation mt-0">
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          disabled={loading}
          onClick={(e) => {
            e.preventDefault();
            onConfirm();
          }}
          className={`min-h-11 touch-manipulation ${destructive ? 'bg-destructive hover:bg-destructive/90' : ''}`}
        >
          {loading ? 'Please wait…' : confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  );
};

export default AdminConfirmDialog;
