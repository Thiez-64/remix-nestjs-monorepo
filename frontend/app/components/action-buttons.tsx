import { ReactNode } from "react";

interface ActionButtonsProps {
  children: ReactNode;
}

export function ActionButtons({ children }: ActionButtonsProps) {
  return (
    <div className="flex space-x-2">
      {children}
    </div>
  );
} 
