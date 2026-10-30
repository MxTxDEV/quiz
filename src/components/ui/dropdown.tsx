"use client";
import { DropdownMenu as DM } from "radix-ui";
import { cn } from "@/lib/utils";

export const Dropdown = DM.Root;
export const DropdownTrigger = DM.Trigger;

export function DropdownContent({ className, align = "end", ...props }: React.ComponentProps<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content
        align={align}
        sideOffset={4}
        className={cn("z-50 min-w-44 rounded-md border bg-card p-1 shadow-lg animate-fade-in", className)}
        {...props}
      />
    </DM.Portal>
  );
}

export function DropdownItem({ className, danger, ...props }: React.ComponentProps<typeof DM.Item> & { danger?: boolean }) {
  return (
    <DM.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] outline-none data-[highlighted]:bg-muted data-[disabled]:opacity-50 [&_svg]:size-3.5 [&_svg]:text-muted-foreground",
        danger && "text-danger [&_svg]:text-danger",
        className,
      )}
      {...props}
    />
  );
}

export const DropdownSeparator = () => <DM.Separator className="my-1 h-px bg-border" />;
