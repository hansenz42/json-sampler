import React from 'react';
import { CardFooter } from "@/components/ui/card";

import { ReactNode } from 'react';

interface FooterProps {
  version?: string;
  companyName?: string | ReactNode;
}

export default function Footer({ 
  version = "v1.0", 
  companyName = "浩森 Hansen" 
}: FooterProps) {
  return (
    <CardFooter className="w-full flex flex-col sm:flex-row justify-between items-center gap-3 py-6 mt-2 text-xs text-muted-foreground border-t border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl shadow-sm">
      <div>🔍 JSON SAMPLER {version}</div>
      <div>© {new Date().getFullYear()} {companyName}</div>
    </CardFooter>
  );
}
