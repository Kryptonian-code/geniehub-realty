import { MessageCircle } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";

interface WhatsAppButtonProps {
  message?: string;
  className?: string;
  variant?: "floating" | "inline";
  label?: string;
}

export default function WhatsAppButton({ message = "Hello, I am interested in a property on GenieHub Realty.", className = "", variant = "floating", label }: WhatsAppButtonProps) {
  const { settings } = useAdmin();
  if (!settings.whatsappNumber) return null;
  const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;

  if (variant === "inline") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#25D366] text-[#fff] font-medium text-sm hover:bg-[#1da851] transition-colors ${className}`}>
        <MessageCircle className="h-4 w-4" />
        {label || "Chat on WhatsApp"}
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:bg-[#1da851] transition-colors ${className}`} aria-label="Contact us on WhatsApp">
      <MessageCircle className="h-6 w-6 text-[#fff]" />
    </a>
  );
}
