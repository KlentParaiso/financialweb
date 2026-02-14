import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefix?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, prefix, ...props }, ref) => {
    if (prefix) {
      return (
        <div className="relative flex items-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] focus-within:ring-2 focus-within:ring-[hsl(var(--primary))] focus-within:ring-offset-1">
          <span className="pl-4 text-[hsl(var(--muted-foreground))]">{prefix}</span>
          <input
            type={type}
            className={cn(
              "flex h-11 w-full bg-transparent py-2 pr-4 text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
      );
    }
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2 text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
