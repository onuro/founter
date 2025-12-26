'use client';

import {
  Type,
  Hash,
  Link,
  Tag,
  Calendar,
  CheckSquare,
  AlignLeft,
  Image as ImageIcon,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FieldType } from '@/types/tables';

const FIELD_TYPE_ICONS: Record<FieldType, LucideIcon> = {
  text: Type,
  number: Hash,
  url: Link,
  select: Tag,
  date: Calendar,
  boolean: CheckSquare,
  longText: AlignLeft,
  image: ImageIcon,
};

interface FieldTypeIconProps {
  type: FieldType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FieldTypeIcon({ type, className, size = 'md' }: FieldTypeIconProps) {
  const Icon = FIELD_TYPE_ICONS[type] || Type;

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <Icon
      className={cn(sizeClasses[size], 'text-muted-foreground shrink-0', className)}
    />
  );
}
