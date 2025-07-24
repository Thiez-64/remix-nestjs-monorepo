import React, { ReactNode } from "react";
import { Card, CardContent } from "./ui/card";

type IconType = ReactNode | React.ComponentType<{ className?: string }>;

interface EmptyStateProps {
  icon: IconType;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  const isComponent = typeof icon === 'function';

  return (
    <Card>
      <CardContent className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            {isComponent ? React.createElement(icon as React.ComponentType<{ className?: string }>, { className: "w-12 h-12" }) : icon}
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
