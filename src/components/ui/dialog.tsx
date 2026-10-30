"use client";
import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({
  className,
  children,
  title,
  description,
  ...props
}: React.ComponentProps<typeof D.Content> & { title: string; description?: string }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/30 animate-fade-in" />
      <D.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-5 shadow-xl animate-slide-up max-h-[90vh] overflow-y-auto",
          className,
        )}
        {...props}
      >
        <div className="mb-4 pr-6">
          <D.Title className="text-base font-semibold">{title}</D.Title>
          {description ? (
            <D.Description className="text-[13px] text-muted-foreground mt-1">{description}</D.Description>
          ) : (
            <D.Description className="sr-only">{title}</D.Description>
          )}
        </div>
        {children}
        <D.Close className="absolute right-4 top-4 rounded-sm p-1 text-muted-foreground hover:bg-muted cursor-pointer" aria-label="Fechar">
          <X className="size-4" />
        </D.Close>
      </D.Content>
    </D.Portal>
  );
}
