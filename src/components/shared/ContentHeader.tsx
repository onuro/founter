'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

interface ContentHeaderProps {
  title: string;
}

export function ContentHeader({ title }: ContentHeaderProps) {
  return (
    <header className="flex m-2 my-4 bg-surface items-center gap-2 py-2 px-4 pl-3 mr-5 rounded-md">
      <SidebarTrigger />
      <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </span>
    </header>
  );
}
