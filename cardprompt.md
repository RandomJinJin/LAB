You are given a task to integrate an existing React component in the codebase

The codebase should support:
- shadcn project structure  
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles. 
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:
```tsx
iso-card.tsx
import * as React from "react";

import { cn } from "@/lib/utils";
import {
  IsoDepth,
  isoDepth,
  isoFace,
} from "@/components/ui/iso-card-utils/iso-depth";

type IsoCardProps = React.ComponentProps<"div"> & {
  /** How far the card stands off the page, in px. Default 8. */
  depth?: number;
};

/** A slab: a card standing on its own depth. Compose it like shadcn's Card. */
function IsoCard({
  className,
  depth = 8,
  style,
  children,
  ...props
}: IsoCardProps) {
  return (
    <div
      data-slot="iso-card"
      className={cn("group/iso relative", className)}
      style={isoDepth(depth, style)}
      {...props}
    >
      <IsoDepth sink={[]} />
      <div
        className={cn(
          isoFace,
          "flex h-full flex-col gap-5 bg-card py-5 text-card-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function IsoCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="iso-card-header"
      className={cn(
        "grid auto-rows-min items-start gap-1 px-5 has-data-[slot=iso-card-action]:grid-cols-[1fr_auto]",
        className,
      )}
      {...props}
    />
  );
}

function IsoCardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="iso-card-title"
      className={cn("leading-none font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

function IsoCardDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="iso-card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function IsoCardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="iso-card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function IsoCardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="iso-card-content"
      className={cn("px-5", className)}
      {...props}
    />
  );
}

function IsoCardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="iso-card-footer"
      className={cn(
        "flex items-center gap-2 border-t border-dashed border-[color:var(--iso-line,var(--border))] px-5 pt-4",
        className,
      )}
      {...props}
    />
  );
}

export {
  IsoCard,
  IsoCardHeader,
  IsoCardTitle,
  IsoCardDescription,
  IsoCardAction,
  IsoCardContent,
  IsoCardFooter,
  type IsoCardProps,
};
export default IsoCard;


demo.tsx
import {
  IsoCard,
  IsoCardContent,
  IsoCardDescription,
  IsoCardFooter,
  IsoCardHeader,
  IsoCardTitle,
} from "@/components/ui/iso-card";
import { IsoInput } from "@/components/ui/iso-card-utils/iso-input";
import { IsoButton } from "@/components/ui/iso-card-utils/iso-button";

export default function IsoCardDemo() {
  return (
    <div className="flex min-h-[320px] w-full items-center justify-center bg-background p-10">
      <IsoCard className="w-full max-w-sm">
        <IsoCardHeader>
          <IsoCardTitle>New project</IsoCardTitle>
          <IsoCardDescription>
            Deploy a fresh copy in one step.
          </IsoCardDescription>
        </IsoCardHeader>
        <IsoCardContent className="grid gap-3">
          <IsoInput placeholder="Project name" aria-label="Project name" />
        </IsoCardContent>
        <IsoCardFooter className="justify-end">
          <IsoButton size="sm" variant="outline" depth={3}>
            Cancel
          </IsoButton>
          <IsoButton size="sm" variant="solid" depth={3}>
            Create
          </IsoButton>
        </IsoCardFooter>
      </IsoCard>
    </div>
  );
}

```

Implementation Guidelines
 1. Analyze the component structure and identify all required dependencies
 2. Review the component's argumens and state
 3. Identify any required context providers or hooks and install them
 4. Questions to Ask
 - What data/props will be passed to this component?
 - Are there any specific state management requirements?
 - Are there any required assets (images, icons, etc.)?
 - What is the expected responsive behavior?
 - What is the best place to use this component in the app?

Steps to integrate
 0. Copy paste all the code above in the correct directories
 1. Install external dependencies
 2. Fill image assets with Unsplash stock images you know exist
 3. Use lucide-react icons for svgs or logos if component requires them