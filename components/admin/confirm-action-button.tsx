"use client";

import { useState } from "react";
import Swal from "sweetalert2";

type Variant = "delete" | "update" | "logout";

const variantConfig: Record<
  Variant,
  { title: string; text: string; confirmButtonText: string; confirmColor: string }
> = {
  delete: {
    title: "Delete this item?",
    text: "This action cannot be undone.",
    confirmButtonText: "Yes, delete",
    confirmColor: "#dc2626",
  },
  update: {
    title: "Confirm update?",
    text: "Make sure the latest changes are correct.",
    confirmButtonText: "Yes, update",
    confirmColor: "#4f46e5",
  },
  logout: {
    title: "Logout now?",
    text: "You will need to sign in again.",
    confirmButtonText: "Yes, logout",
    confirmColor: "#4f46e5",
  },
};

type ConfirmActionButtonProps = {
  variant: Variant;
  label: string;
  className?: string;
  onConfirmed?: () => Promise<void> | void;
  icon?: React.ReactNode;
  iconOnly?: boolean;
};

export function ConfirmActionButton({
  variant,
  label,
  className,
  onConfirmed,
  icon,
  iconOnly,
}: ConfirmActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    const config = variantConfig[variant];
    const result = await Swal.fire({
      title: config.title,
      text: config.text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: config.confirmButtonText,
      confirmButtonColor: config.confirmColor,
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setIsLoading(true);
      await onConfirmed?.();
    } catch (error) {
      await Swal.fire({
        title: "Action failed",
        text: error instanceof Error ? error.message : "Something went wrong.",
        icon: "error",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`transition disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
    >
      {isLoading ? (
        "Please wait..."
      ) : (
        <>
          {iconOnly ? (
            <>
              {icon}
              <span className="sr-only">{label}</span>
            </>
          ) : (
            <span className="inline-flex items-center gap-2">
              {icon}
              {label}
            </span>
          )}
        </>
      )}
    </button>
  );
}
