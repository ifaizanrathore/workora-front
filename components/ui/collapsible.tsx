'use client';

import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const Collapsible = CollapsiblePrimitive.Root;
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;

// Section Collapsible (used for Fields, Tags, Attachments sections)
interface SectionCollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  actions?: React.ReactNode;
}

const SectionCollapsible: React.FC<SectionCollapsibleProps> = ({
  title,
  children,
  defaultOpen = true,
  className,
  actions,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn('w-full', className)}>
      <div className="flex items-center justify-between py-2">
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-text-primary hover:text-primary transition-colors">
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              isOpen ? 'rotate-0' : '-rotate-90'
            )}
          />
          {title}
        </CollapsibleTrigger>
        {actions && (
          <div className="flex items-center gap-1">
            {actions}
          </div>
        )}
      </div>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        <div className="pb-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// Card Collapsible (with border)
interface CardCollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerActions?: React.ReactNode;
  icon?: React.ReactNode;
}

const CardCollapsible: React.FC<CardCollapsibleProps> = ({
  title,
  children,
  defaultOpen = true,
  className,
  headerActions,
  icon,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn('w-full rounded-lg border border-border bg-white', className)}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-text-primary hover:text-primary transition-colors">
          {icon}
          {title}
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              isOpen ? 'rotate-0' : '-rotate-90'
            )}
          />
        </CollapsibleTrigger>
        {headerActions && (
          <div className="flex items-center gap-1">{headerActions}</div>
        )}
      </div>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        <div className="p-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  SectionCollapsible,
  CardCollapsible,
};
