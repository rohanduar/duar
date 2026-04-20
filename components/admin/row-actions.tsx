"use client";

import Swal from "sweetalert2";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { Pencil, Trash2 } from "lucide-react";

type RowActionsProps = {
  itemLabel: string;
  mobile?: boolean;
  onEdit?: () => void;
  onDelete?: () => Promise<void> | void;
};

export function RowActions({
  itemLabel,
  mobile = false,
  onEdit,
  onDelete,
}: RowActionsProps) {
  async function handleDelete() {
    await onDelete?.();
    await Swal.fire({
      title: "Deleted",
      text: `${itemLabel} deleted successfully.`,
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
      timerProgressBar: true,
    });
  }

  return (
    <>
      {mobile ? (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Edit
          </button>
          <ConfirmActionButton
            variant="delete"
            label="Delete"
            onConfirmed={handleDelete}
            className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
          />
        </div>
      ) : (
        <div className="flex w-full justify-end gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-600 transition hover:bg-gray-50"
            title="Edit"
            aria-label={`Edit ${itemLabel}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <ConfirmActionButton
            variant="delete"
            label="Delete"
            onConfirmed={handleDelete}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-500 text-white hover:bg-red-600"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            iconOnly
          />
        </div>
      )}
    </>
  );
}
