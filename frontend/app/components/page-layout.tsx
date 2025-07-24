import { ReactNode } from "react";
import { Button } from "./ui/button";

interface PageLayoutProps {
  title: string;
  description: string;
  actionButton?: {
    label: string;
    icon: ReactNode;
    onClick: () => void;
  };
  action?: ReactNode;
  alertMessage?: {
    message: string;
    icon: ReactNode;
    variant?: "warning" | "error" | "info";
  };
  children: ReactNode;
}

const alertVariants = {
  warning: "bg-orange-100 text-orange-800",
  error: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
};

export function PageLayout({
  title,
  description,
  actionButton,
  action,
  alertMessage,
  children
}: PageLayoutProps) {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-gray-600">{description}</p>
          {alertMessage && (
            <div className={`p-2 mt-2 rounded-md text-sm flex items-center gap-2 w-fit ${alertVariants[alertMessage.variant || "warning"]
              }`}>
              {alertMessage.icon}
              {alertMessage.message}
            </div>
          )}
        </div>

        {action && action}
        {actionButton && (
          <Button onClick={actionButton.onClick}>
            {actionButton.icon}
            {actionButton.label}
          </Button>
        )}
      </div>

      {children}
    </div>
  );
}
