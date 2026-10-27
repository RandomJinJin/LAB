import * as React from "react";

import { cn } from "../../lib/utils";
import { IsoDepth, isoDepth, isoFace } from "./iso-card-utils/iso-depth";

type IsoCardProps = React.ComponentProps<"div"> & {
  /** 卡片抬离纸面的高度，单位 px，默认 8 */
  depth?: number;
};

/** 一块立在自身厚度上的卡片，用法与 shadcn Card 一致。 */
function IsoCard({ className, depth = 6, style, children, ...props }: IsoCardProps) {
  return (
    <div
      data-slot="iso-card"
      className={cn("iso-card group/iso relative", className)}
      style={isoDepth(depth, style)}
      {...props}
    >
      <IsoDepth depth={depth} sink={[]} />
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

function IsoCardDescription({ className, ...props }: React.ComponentProps<"div">) {
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
        "flex items-center gap-2 border-t border-dotted border-border px-5 pt-4",
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
