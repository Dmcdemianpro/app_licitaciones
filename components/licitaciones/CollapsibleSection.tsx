"use client";

import { useState, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  badge?: string | number;
  children: ReactNode;
  defaultOpen?: boolean;
  headerActions?: ReactNode;
}

export function CollapsibleSection({
  title,
  description,
  icon,
  badge,
  children,
  defaultOpen = true,
  headerActions,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl backdrop-blur">
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-2">
                {icon && <span className="text-slate-600 dark:text-slate-400">{icon}</span>}
                <CardTitle className="text-slate-900 dark:text-white">
                  {title}
                </CardTitle>
                {badge !== undefined && (
                  <Badge variant="outline" className="ml-2">
                    {badge}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {headerActions && (
                  <div onClick={(e) => e.stopPropagation()}>
                    {headerActions}
                  </div>
                )}
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          {description && (
            <CardDescription className="text-slate-600 dark:text-slate-300">
              {description}
            </CardDescription>
          )}
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
