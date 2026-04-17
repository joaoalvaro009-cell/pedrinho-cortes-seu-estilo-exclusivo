import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BARBER_WHATSAPP, buildClientLink, buildWhatsappUrl } from "@/lib/appointments";

const Booking = () => {
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [styleMode, setStyleMode] = useState<"custom" | "barber">("custom");
  const [styleText, setStyleText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [unavailableWeekdays, setUnavailableWeekdays] = useState<number[]>([0, 1]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Carregar disponibilidade
  useEffect(() => {
    (async () => {
      const [avail, blocked] = await Promise.all([
        supabase.from("availability_settings").select("*").limit(1).maybeSingle(),
        supabase.from("blocked_dates").select("blocked_date"),
      ]);
      if (avail.data) {
        setUnavailableWeekdays(avail.data.unavailable_weekdays ?? [0, 1]);
        setTimeSlots(avail.data.time_slots ?? []);
      }
      if (blocked.data) setBlockedDates(blocked.data.map((b) => b.blocked_date));
    })();
  }, []);

  // Buscar horários ocupados na data selecionada
  useEffect(() => {
    if (!date) {
      setBookedTimes([]);
      return;
    }
    const iso = format(date, "yyyy-MM-dd");
    supabase.rpc("get_booked_times", { _date: iso }).then(({ data }) => {
      setBookedTimes((data ?? []).map((r: { appointment_time: string }) => r.appointment_time));
    });
  }, [date]);

  const isDateDisabled = (d: Date) => {
    if (d < today) return true;
    if (unavailableWeekdays.includes(d.getDay())) return true;
    if (blockedDates.includes(format(d, "yyyy-MM-dd"))) return true;
    return false;
  };

  const handleConfirm = async () => {
    if (!name.trim()) return toast.error("Por favor, informe seu nome.");
    if (!date) return toast.error("Selecione uma data.");
    if (!time) return toast.error("Selecione um horário.");
    if (styleMode === "custom" && !styleText.trim())
      return toast.error("Descreva o corte ou escolha 'Deixar o barbeiro escolher'.");

    setSubmitting(true);
    const cutType = styleMode === "barber" ? "Deixar o barbeiro escolher o melhor estilo" : styleText.trim();
    const isoDate = format(date, "yyyy-MM-dd");
    const accessToken = crypto.randomUUID();

    const { error } = await supabase
      .from("appointments")
      .insert({
        access_token: accessToken,
        client_name: name.trim(),
        client_phone: phone.trim() || null,
        appointment_date: isoDate,
        appointment_time: time,
        cut_type: cutType,
        barber_choice: styleMode === "barber",
      });

    setSubmitting(false);
    if (error) {
      console.error("Erro ao agendar:", error);
      toast.error(`Não foi possível agendar: ${error.message}`);
      return;
    }

    const dataFmt = format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
    const link = buildClientLink(accessToken);
    const msg = `Olá, Pedrinho! Acabei de agendar um horário.

*Nome:* ${name}
*Data:* ${dataFmt}
*Horário:* ${time}
*Tipo de corte:* ${cutType}

Meu link de acompanhamento: ${link}

Aguardo sua confirmação. Pagamento combinado no local.`;

    window.open(buildWhatsappUrl(BARBER_WHATSAPP, msg), "_blank");
    toast.success("Agendamento criado! Redirecionando para o WhatsApp...");

    setTimeout(() => {
      window.location.href = `/agendamento/${accessToken}`;
    }, 1200);
  };

  return (
    <section id="agendar" className="py-24 md:py-32 bg-gradient-dark">
      <div className="container max-w-3xl">
        <div className="text-center mb-12">
          <p className="text-primary uppercase tracking-[0.3em] text-xs mb-4">Agendamento</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-4">Reserve seu horário</h2>
          <p className="text-muted-foreground">Escolha data, horário e estilo. Em poucos cliques.</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 md:p-10 shadow-elegant space-y-8">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm uppercase tracking-wider text-muted-foreground">Seu nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Ex: João Silva" className="h-12 bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm uppercase tracking-wider text-muted-foreground">WhatsApp (opcional)</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="(11) 99999-9999" className="h-12 bg-background border-border" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm uppercase tracking-wider text-muted-foreground">Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full h-12 justify-start text-left font-normal bg-background border-border", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {date ? format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => { setDate(d); setTime(undefined); }}
                  disabled={isDateDisabled}
                  locale={ptBR}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-3">
            <Label className="text-sm uppercase tracking-wider text-muted-foreground">Horário</Label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {timeSlots.map((t) => {
                const active = time === t;
                const taken = bookedTimes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={!date || taken}
                    onClick={() => setTime(t)}
                    className={cn(
                      "h-11 rounded-md border text-sm font-medium transition-all",
                      "disabled:opacity-40 disabled:cursor-not-allowed disabled:line-through",
                      active
                        ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold"
                        : "bg-background border-border hover:border-primary/50 hover:text-primary"
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            {!date && <p className="text-xs text-muted-foreground">Selecione uma data para ver os horários.</p>}
          </div>

          <div className="space-y-3">
            <Label className="text-sm uppercase tracking-wider text-muted-foreground">Tipo de corte</Label>
            <RadioGroup value={styleMode} onValueChange={(v) => setStyleMode(v as "custom" | "barber")} className="grid sm:grid-cols-2 gap-3">
              <label className={cn("flex items-start gap-3 p-4 rounded-md border cursor-pointer transition-all", styleMode === "custom" ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40")}>
                <RadioGroupItem value="custom" className="mt-1" />
                <div>
                  <p className="font-medium text-sm">Eu descrevo o corte</p>
                  <p className="text-xs text-muted-foreground mt-1">Conte como você imagina o resultado.</p>
                </div>
              </label>
              <label className={cn("flex items-start gap-3 p-4 rounded-md border cursor-pointer transition-all", styleMode === "barber" ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40")}>
                <RadioGroupItem value="barber" className="mt-1" />
                <div>
                  <p className="font-medium text-sm">Deixar o barbeiro escolher</p>
                  <p className="text-xs text-muted-foreground mt-1">O melhor estilo para você.</p>
                </div>
              </label>
            </RadioGroup>

            {styleMode === "custom" && (
              <Textarea
                value={styleText}
                onChange={(e) => setStyleText(e.target.value)}
                maxLength={500}
                placeholder="Ex: Degradê médio, com risco lateral e barba alinhada..."
                className="min-h-[100px] bg-background border-border resize-none"
              />
            )}
          </div>

          <div className="pt-2 space-y-4">
            <Button onClick={handleConfirm} disabled={submitting} size="lg" className="w-full h-14 bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold text-base">
              {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <MessageCircle className="mr-2 h-5 w-5" />}
              {submitting ? "Agendando..." : "Confirmar agendamento"}
            </Button>
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
              <Check className="h-3 w-3 text-primary" />
              Valores a combinar. Pagamento no local. Você receberá um link para gerenciar seu agendamento.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Booking;
