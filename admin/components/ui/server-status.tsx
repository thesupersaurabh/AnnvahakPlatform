import { Button } from "@/components/ui/button";
import { FileClock } from "lucide-react";
import { ReactNode } from "react";

interface ServerStatusProps {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  loadingMessage?: string;
  errorMessage?: string;
  children: ReactNode;
}

export function ServerStatus({
  isLoading,
  isError,
  onRetry,
  loadingMessage = "Loading data...",
  errorMessage = "We couldn't connect to the server. Please check your internet connection and try again.",
  children
}: ServerStatusProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
        <h3 className="text-xl font-semibold">{loadingMessage}</h3>
        <p className="text-muted-foreground mt-2">Please wait while we connect to the server</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] border rounded-lg p-8 bg-muted/10">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <FileClock className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold">Connection Error</h3>
        <p className="text-muted-foreground text-center max-w-md mt-2">
          {errorMessage}
        </p>
        <Button className="mt-6" onClick={onRetry}>
          Try Again
        </Button>
      </div>
    );
  }

  return <>{children}</>;
} 