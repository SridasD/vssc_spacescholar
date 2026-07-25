import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface ChatbotButtonProps {
  onClick: () => void;
}

export function ChatbotButton({ onClick }: ChatbotButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="px-2"
    >
      <MessageSquare className="h-4 w-4" />
    </Button>
  );
}