import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;

  confirmText?: string;
  cancelText?: string;

  /** Called when user confirms */
  onConfirm: () => void;

  /** Called when dialog open state changes (ESC, click outside, Cancel) */
  onOpenChange: (open: boolean) => void;

  confirmDisabled?: boolean;

  /**
   * Optional: pass your app button classes to match existing style.
   * Example from your screen: "btn primary small-btn", "btn secondary small-btn"
   */
  confirmButtonClassName?: string;
  cancelButtonClassName?: string;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onOpenChange,
  confirmDisabled,
  confirmButtonClassName = "btn primary small-btn",
  cancelButtonClassName = "btn secondary small-btn",
}: ConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay style={styles.overlay} />
        <AlertDialogPrimitive.Content style={styles.content} aria-describedby={description ? undefined : undefined}>
          <div style={styles.header}>
            <AlertDialogPrimitive.Title style={styles.title}>{title}</AlertDialogPrimitive.Title>
            {description ? (
              <AlertDialogPrimitive.Description style={styles.description}>
                {description}
              </AlertDialogPrimitive.Description>
            ) : null}
          </div>

          <div style={styles.footer}>
            <AlertDialogPrimitive.Cancel asChild>
              <button className={cancelButtonClassName} type="button">
                {cancelText}
              </button>
            </AlertDialogPrimitive.Cancel>

            <AlertDialogPrimitive.Action asChild>
              <button
                className={confirmButtonClassName}
                type="button"
                disabled={confirmDisabled}
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 1000,
  },
  content: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "min(520px, calc(100vw - 32px))",
    background: "#fff",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
    zIndex: 1001,
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: 650,
    color: "rgba(0,0,0,0.9)",
    lineHeight: 1.2,
  },
  description: {
    fontSize: 13,
    color: "rgba(0,0,0,0.62)",
    lineHeight: 1.35,
  },
  footer: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
  },
};
