import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, MessageCircle, XCircle, RefreshCw, Loader2, ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Appointment, STATUS_LABEL, STATUS_COLOR, BARBER_WHATSAPP, buildWhatsappUrl } from "@/lib/appointments";

const ClientAppointment = () => {
  const { token } = useParams<{ token: string }>();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState(false);

  const [newDate, setNewDate] = useState<Date | undefined>();
  const [newTime, setNewTime] = useState<string | undefined>();
  const [unavailableWeekdays, setUnavailableWeekdays] = useState<number[]>([0, 1]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    const { data } = await supabase.rpc("get_appointment_by_token", { _token: token });
    setAppt((data?.[0] as Appointment) ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [token]);

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

  useEffect(() => {
    if (!newDate) { setBookedTimes([]); return; }
    const iso = format(newDate, "yyyy-MM-dd");
    supabase.rpc("get_booked_times", { _date: iso }).then(({ data }) => {
      setBookedTimes((data ?? []).map((r: { appointment_time: string }) => r.appointment_time));
    });
  }, [newDate]);

  const isDateDisabled = (d: Date) => {
    if (d < today) return true;
    if (unavailableWeekdays.includes(d.getDay())) return true;
    if (blockedDates.includes(format(d, "yyyy-MM-dd"))) return true;
    return false;
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime || !token) return toast.error("Escolha data e horário.");
    const iso = format(newDate, "yyyy-MM-dd");
    const { data, error } = await supabase.rpc("update_appointment_by_token", {
      _token: token, _new_date: iso, _new_time: newTime,
    });
    if (error || !data) return toast.error("Não foi possível remarcar.");
    toast.success("Agendamento remarcado!");
    setRescheduling(false);
    setNewDate(undefined); setNewTime(undefined);
    load();

    const dataFmt = format(newDate, "EEEE, dd 'de' MMMM", { locale: ptBR });
    const msg = `Olá, Pedrinho! Remarquei meu agendamento.

*Nome:* ${appt?.client_name}
*Nova data:* ${dataFmt}
*Novo horário:* ${newTime}

Aguardo sua confirmação.`;
    window.open(buildWhatsappUrl(BARBER_WHATSAPP, msg), "_blank");
  };

  const handleCancel = async () => {
    if (!token) return;
    const { data, error } = await supabase.rpc("cancel_appointment_by_token", {
      _token: token, _reason: "Cancelado pelo cliente",
    });
    if (error || !data) return toast.error("Não foi possível cancelar.");
    toast.success("Agendamento cancelado.");
    load();

    const msg = `Olá, Pedrinho! Preciso cancelar meu agendamento de ${appt?.appointment_date} às ${appt?.appointment_time}. Obrigado!`;
    window.open(buildWhatsappUrl(BARBER_WHATSAPP, msg), "_blank");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!appt) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-serif text-3xl mb-3">Agendamento não encontrado</h1>
          <p className="text-muted-foreground mb-6">Verifique o link recebido.</p>
          <Button asChild><Link to="/">Voltar ao início</Link></Button>
        </div>
      </main>
    );
  }

  const dateFmt = format(new Date(appt.appointment_date + "T12:00:00"), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const isFinal = appt.status === "cancelado" || appt.status === "concluido";

  return (
    <main className="min-h-screen bg-gradient-dark py-12 px-4">
      <div className="container max-w-2xl">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao site
        </Link>

        <div className="bg-card border border-border rounded-xl p-6 md:p-10 shadow-elegant space-y-6">
          <div>
            <p className="text-primary uppercase tracking-[0.3em] text-xs mb-2">Seu agendamento</p>
            <h1 className="font-serif text-3xl md:text-4xl">{appt.client_name}</h1>
          </div>

          <div className={cn("inline-flex px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider", STATUS_COLOR[appt.status])}>
            {STATUS_LABEL[appt.status]}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-background border border-border rounded-md p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Data</p>
              <p className="font-medium">{dateFmt}</p>
            </div>
            <div className="bg-background border border-border rounded-md p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Horário</p>
              <p className="font-medium">{appt.appointment_time}</p>
            </div>
            <div className="bg-background border border-border rounded-md p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Tipo de corte</p>
              <p className="font-medium">{appt.cut_type}</p>
            </div>
            {appt.agreed_price != null && (
              <div className="bg-background border border-primary/40 rounded-md p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-wider text-primary mb-1">Valor combinado</p>
                <p className="font-serif text-2xl text-primary">R$ {Number(appt.agreed_price).toFixed(2)}</p>
              </div>
            )}
            {appt.notes && (
              <div className="bg-background border border-border rounded-md p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Observações</p>
                <p className="text-sm">{appt.notes}</p>
              </div>
            )}
            {appt.cancellation_reason && (
              <div className="bg-destructive/5 border border-destructive/30 rounded-md p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-wider text-destructive mb-1">Motivo do cancelamento</p>
                <p className="text-sm">{appt.cancellation_reason}</p>
              </div>
            )}
          </div>

          {!isFinal && (
            <div className="space-y-3 pt-2">
              <Button
                onClick={() => window.open(buildWhatsappUrl(BARBER_WHATSAPP, `Olá Pedrinho, sobre meu agendamento em ${dateFmt} às ${appt.appointment_time}.`), "_blank")}
                size="lg" className="w-full h-12 bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold"
              >
                <MessageCircle className="mr-2 h-5 w-5" /> Falar com o barbeiro
              </Button>

              <div className="grid sm:grid-cols-2 gap-3">
                <Button onClick={() => setRescheduling((s) => !s)} variant="outline" className="h-11">
                  <RefreshCw className="mr-2 h-4 w-4" /> Remarcar
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="h-11 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <XCircle className="mr-2 h-4 w-4" /> Cancelar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
                      <AlertDialogDescription>O horário será liberado. Você poderá agendar novamente quando quiser.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancel} className="bg-destructive hover:bg-destructive/90">Confirmar cancelamento</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}

          {isFinal && (
            <div className="pt-2">
              <Button asChild size="lg" className="w-full h-12 bg-gradient-gold text-primary-foreground">
                <Link to="/#agendar">Agendar novamente</Link>
              </Button>
            </div>
          )}

          {rescheduling && !isFinal && (
            <div className="border-t border-border pt-6 space-y-4">
              <h3 className="font-serif text-xl">Escolher nova data e horário</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full h-12 justify-start font-normal bg-background", !newDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {newDate ? format(newDate, "EEEE, dd 'de' MMMM", { locale: ptBR }) : "Nova data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={newDate} onSelect={(d) => { setNewDate(d); setNewTime(undefined); }}
                    disabled={isDateDisabled} locale={ptBR} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {timeSlots.map((t) => {
                  const active = newTime === t;
                  const taken = bookedTimes.includes(t) && t !== appt.appointment_time;
                  return (
                    <button key={t} type="button" disabled={!newDate || taken} onClick={() => setNewTime(t)}
                      className={cn("h-11 rounded-md border text-sm font-medium transition-all disabled:opacity-40 disabled:line-through",
                        active ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold"
                          : "bg-background border-border hover:border-primary/50 hover:text-primary")}>
                      {t}
                    </button>
                  );
                })}
              </div>

              <Button onClick={handleReschedule} className="w-full h-12 bg-gradient-gold text-primary-foreground">
                <Check className="mr-2 h-4 w-4" /> Confirmar nova data
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ClientAppointment;
