"use client";
import { Tabs as T } from "radix-ui";
import { cn } from "@/lib/utils";

export const Tabs = T.Root;
export function TabsList({ className, ...props }: React.ComponentProps<typeof T.List>) {
  return <T.List className={cn("inline-flex items-center gap-1 rounded-md bg-muted p-1", className)} {...props} />;
}
export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[13px] font-medium text-muted-foreground transition-colors data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs cursor-pointer [&_svg]:size-3.5",
        className,
      )}
      {...props}
    />
  );
}
export const TabsContent = T.Content;
