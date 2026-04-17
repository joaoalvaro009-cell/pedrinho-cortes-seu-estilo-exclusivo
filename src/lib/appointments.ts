// Helpers e constantes para agendamentos
import { Database } from "@/integrations/supabase/types";

export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  aguardando_confirmacao: "Aguardando confirmação",
  confirmado: "Confirmado",
  valor_enviado: "Valor enviado",
  remarcado: "Remarcado",
  cancelado: "Cancelado",
  concluido: "Concluído",
};

export const STATUS_COLOR: Record<AppointmentStatus, string> = {
  aguardando_confirmacao: "bg-muted text-muted-foreground",
  confirmado: "bg-primary/15 text-primary border border-primary/30",
  valor_enviado: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  remarcado: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  cancelado: "bg-destructive/15 text-destructive border border-destructive/30",
  concluido: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
};

export const BARBER_WHATSAPP = "5575991793513"; // Pedrinho — formato internacional sem +

export function buildClientLink(token: string) {
  return `${window.location.origin}/agendamento/${token}`;
}

export function buildWhatsappUrl(phoneOrEmpty: string, message: string) {
  const base = phoneOrEmpty
    ? `https://wa.me/${phoneOrEmpty.replace(/\D/g, "")}`
    : `https://wa.me/${BARBER_WHATSAPP}`;
  return `${base}?text=${encodeURIComponent(message)}`;
}
