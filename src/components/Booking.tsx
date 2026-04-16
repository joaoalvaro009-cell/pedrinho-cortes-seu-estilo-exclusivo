import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { BARBER } from "@/lib/barber";
import { toast } from "sonner";

const Booking = () => {
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [styleMode, setStyleMode] = useState<"custom" | "barber">("custom");
  const [styleText, setStyleText] = useState("");

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isDateDisabled = (d: Date) => {
    if (d < today) return true;
    if (BARBER.unavailableWeekdays.includes(d.getDay())) return true;
    const iso = format(d, "yyyy-MM-dd");
    if (BARBER.blockedDates.includes(iso)) return true;
    return false;
  };

  const handleConfirm = () => {
    if (!name.trim()) return toast.error("Por favor, informe seu nome.");
    if (!date) return toast.error("Selecione uma data.");
    if (!time) return toast.error("Selecione um horário.");
    if (styleMode === "custom" && !styleText.trim()) return toast.error("Descreva o corte desejado ou escolha 'Deixar o barbeiro escolher'.");

    const estilo = styleMode === "barber" ? "Deixar o barbeiro escolher o melhor estilo" : styleText.trim();
    const dataFmt = format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });

    const msg = `Olá, Pedrinho! Gostaria de agendar um horário.

*Nome:* ${name}
*Data:* ${dataFmt}
*Horário:* ${time}
*Tipo de corte:* ${estilo}

Aguardo sua confirmação.`;

    const url = `https://wa.me/${BARBER.whatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    toast.success("Redirecionando para o WhatsApp...");
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
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm uppercase tracking-wider text-muted-foreground">Seu nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João Silva" className="h-12 bg-background border-border" />
          </div>

          {/* Data */}
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

          {/* Horários */}
          <div className="space-y-3">
            <Label className="text-sm uppercase tracking-wider text-muted-foreground">Horário</Label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {BARBER.timeSlots.map((t) => {
                const active = time === t;
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={!date}
                    onClick={() => setTime(t)}
                    className={cn(
                      "h-11 rounded-md border text-sm font-medium transition-all",
                      "disabled:opacity-40 disabled:cursor-not-allowed",
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

          {/* Estilo */}
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
                placeholder="Ex: Degradê médio, com risco lateral e barba alinhada..."
                className="min-h-[100px] bg-background border-border resize-none"
              />
            )}
          </div>

          {/* Confirmar */}
          <div className="pt-2 space-y-4">
            <Button onClick={handleConfirm} size="lg" className="w-full h-14 bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold text-base">
              <MessageCircle className="mr-2 h-5 w-5" />
              Confirmar agendamento
            </Button>
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
              <Check className="h-3 w-3 text-primary" />
              Após o agendamento, o barbeiro entrará em contato para confirmar horário e valores.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Booking;
