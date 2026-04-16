import { MessageCircle } from "lucide-react";
import { BARBER } from "@/lib/barber";

const WhatsAppFloat = () => {
  return (
    <a
      href={`https://wa.me/${BARBER.whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-gold text-primary-foreground flex items-center justify-center shadow-gold hover:scale-110 transition-transform"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
};

export default WhatsAppFloat;
