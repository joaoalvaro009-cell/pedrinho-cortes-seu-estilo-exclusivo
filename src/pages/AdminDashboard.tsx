import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, LogOut, MessageCircle, Copy, CalendarIcon, Settings, RefreshCw, XCircle, DollarSign, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Appointment, AppointmentStatus, STATUS_LABEL, STATUS_COLOR, buildWhatsappUrl, buildClientLink } from "@/lib/appointments";

const STATUS_OPTIONS: AppointmentStatus[] = [
  "aguardando_confirmacao", "confirmado", "valor_enviado", "remarcado", "cancelado", "concluido",
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tab, setTab] = useState("hoje");

  // Settings state
  const [unavailable, setUnavailable] = useState<number[]>([]);
  const [slotsText, setSlotsText] = useState("");
  const [blocked, setBlocked] = useState<{ id: string; blocked_date: string; reason: string | null }[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState<Date | undefined>();
  const [newBlockedReason, setNewBlockedReason] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) { navigate("/admin/login"); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", sess.session.user.id).eq("role", "admin");
      if (!roles || roles.length === 0) {
        toast.error("Acesso negado.");
        await supabase.auth.signOut();
        navigate("/admin/login");
        return;
      }
      setIsAdmin(true);
      await Promise.all([loadAppointments(), loadSettings()]);
      setLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/admin/login");
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const loadAppointments = async () => {
    const { data } = await supabase.from("appointments").select("*").order("appointment_date").order("appointment_time");
    setAppointments(data ?? []);
  };

  const loadSettings = async () => {
    const [a, b] = await Promise.all([
      supabase.from("availability_settings").select("*").limit(1).maybeSingle(),
      supabase.from("blocked_dates").select("*").order("blocked_date"),
    ]);
    if (a.data) {
      setUnavailable(a.data.unavailable_weekdays ?? []);
      setSlotsText((a.data.time_slots ?? []).join(", "));
    }
    setBlocked(b.data ?? []);
  };

  const todayIso = format(new Date(), "yyyy-MM-dd");
  const filtered = useMemo(() => {
    const hoje = appointments.filter((a) => a.appointment_date === todayIso && a.status !== "cancelado");
    const proximos = appointments.filter((a) => a.appointment_date > todayIso && !["cancelado", "concluido"].includes(a.status));
    const cancelados = appointments.filter((a) => a.status === "cancelado");
    const concluidos = appointments.filter((a) => a.status === "concluido");
    return { hoje, proximos, cancelados, concluidos, todos: appointments };
  }, [appointments, todayIso]);

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast.error("Erro ao atualizar.");
    toast.success("Status atualizado.");
    loadAppointments();
  };

  const cancelAppt = async (id: string, reason: string) => {
    const { error } = await supabase.from("appointments").update({ status: "cancelado", cancellation_reason: reason }).eq("id", id);
    if (error) return toast.error("Erro.");
    toast.success("Agendamento cancelado.");
    loadAppointments();
  };

  const setPriceNotes = async (id: string, price: string, notes: string) => {
    const update: { notes: string | null; agreed_price?: number; status?: AppointmentStatus } = { notes: notes || null };
    if (price) {
      const p = parseFloat(price.replace(",", "."));
      if (!isNaN(p)) { update.agreed_price = p; update.status = "valor_enviado"; }
    }
    const { error } = await supabase.from("appointments").update(update).eq("id", id);
    if (error) return toast.error("Erro.");
    toast.success("Atualizado.");
    loadAppointments();
  };

  const reschedule = async (id: string, date: Date, time: string) => {
    const iso = format(date, "yyyy-MM-dd");
    const { error } = await supabase.from("appointments").update({
      appointment_date: iso, appointment_time: time, status: "remarcado",
    }).eq("id", id);
    if (error) return toast.error("Erro.");
    toast.success("Remarcado.");
    loadAppointments();
  };

  const saveAvailability = async () => {
    const slots = slotsText.split(",").map((s) => s.trim()).filter(Boolean);
    const { data: existing } = await supabase.from("availability_settings").select("id").limit(1).maybeSingle();
    const payload = { unavailable_weekdays: unavailable, time_slots: slots };
    const op = existing
      ? supabase.from("availability_settings").update(payload).eq("id", existing.id)
      : supabase.from("availability_settings").insert(payload);
    const { error } = await op;
    if (error) return toast.error("Erro ao salvar.");
    toast.success("Disponibilidade salva.");
  };

  const addBlocked = async () => {
    if (!newBlockedDate) return;
    const iso = format(newBlockedDate, "yyyy-MM-dd");
    const { error } = await supabase.from("blocked_dates").insert({ blocked_date: iso, reason: newBlockedReason || null });
    if (error) return toast.error("Erro (data já bloqueada?).");
    setNewBlockedDate(undefined); setNewBlockedReason("");
    toast.success("Data bloqueada.");
    loadSettings();
  };

  const removeBlocked = async (id: string) => {
    await supabase.from("blocked_dates").delete().eq("id", id);
    loadSettings();
  };

  const logout = async () => { await supabase.auth.signOut(); navigate("/admin/login"); };

  if (loading || !isAdmin) {
    return <main className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>;
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="border-b border-border sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between h-16">
          <div>
            <h1 className="font-serif text-xl">Painel do Barbeiro</h1>
            <p className="text-xs text-muted-foreground">Pedrinho Cortes</p>
          </div>
          <Button variant="outline" size="sm" onClick={logout}><LogOut className="h-4 w-4 mr-2" />Sair</Button>
        </div>
      </header>

      <div className="container py-6 max-w-6xl">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full">
            <TabsTrigger value="hoje">Hoje ({filtered.hoje.length})</TabsTrigger>
            <TabsTrigger value="proximos">Próximos ({filtered.proximos.length})</TabsTrigger>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="cancelados">Cancelados</TabsTrigger>
            <TabsTrigger value="concluidos">Concluídos</TabsTrigger>
            <TabsTrigger value="config"><Settings className="h-4 w-4" /></TabsTrigger>
          </TabsList>

          {(["hoje","proximos","todos","cancelados","concluidos"] as const).map((key) => (
            <TabsContent key={key} value={key} className="space-y-3 mt-6">
              {filtered[key].length === 0 ? (
                <p className="text-center text-muted-foreground py-12">Nenhum agendamento.</p>
              ) : (
                filtered[key].map((a) => (
                  <ApptCard key={a.id} appt={a} onStatus={updateStatus} onCancel={cancelAppt} onPrice={setPriceNotes} onReschedule={reschedule} />
                ))
              )}
            </TabsContent>
          ))}

          <TabsContent value="config" className="mt-6 space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h3 className="font-serif text-xl">Dias indisponíveis (semana)</h3>
              <div className="flex flex-wrap gap-2">
                {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map((d, i) => {
                  const off = unavailable.includes(i);
                  return (
                    <button key={i} onClick={() => setUnavailable(off ? unavailable.filter(x => x !== i) : [...unavailable, i])}
                      className={cn("px-4 h-10 rounded-md border text-sm font-medium",
                        off ? "bg-destructive/15 border-destructive/40 text-destructive" : "bg-background border-border")}>
                      {d}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2">
                <Label>Horários disponíveis (separados por vírgula)</Label>
                <Textarea value={slotsText} onChange={(e) => setSlotsText(e.target.value)} className="bg-background" rows={3} />
              </div>
              <Button onClick={saveAvailability} className="bg-gradient-gold text-primary-foreground">Salvar disponibilidade</Button>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h3 className="font-serif text-xl">Datas bloqueadas</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newBlockedDate ? format(newBlockedDate, "dd/MM/yyyy") : "Escolher data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={newBlockedDate} onSelect={setNewBlockedDate} className={cn("p-3 pointer-events-auto")} /></PopoverContent>
                </Popover>
                <Input placeholder="Motivo (opcional)" value={newBlockedReason} onChange={(e) => setNewBlockedReason(e.target.value)} className="bg-background" />
                <Button onClick={addBlocked} className="bg-gradient-gold text-primary-foreground">Bloquear</Button>
              </div>
              <div className="space-y-2">
                {blocked.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-background border border-border rounded-md">
                    <div>
                      <p className="font-medium">{format(new Date(b.blocked_date + "T12:00:00"), "dd/MM/yyyy")}</p>
                      {b.reason && <p className="text-xs text-muted-foreground">{b.reason}</p>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeBlocked(b.id)}><XCircle className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
                {blocked.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma data bloqueada.</p>}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

// === Card de agendamento ===
function ApptCard({ appt, onStatus, onCancel, onPrice, onReschedule }: {
  appt: Appointment;
  onStatus: (id: string, s: AppointmentStatus) => void;
  onCancel: (id: string, reason: string) => void;
  onPrice: (id: string, price: string, notes: string) => void;
  onReschedule: (id: string, date: Date, time: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [price, setPrice] = useState(appt.agreed_price?.toString() ?? "");
  const [notes, setNotes] = useState(appt.notes ?? "");
  const [rDate, setRDate] = useState<Date | undefined>();
  const [rTime, setRTime] = useState("");
  const dateFmt = format(new Date(appt.appointment_date + "T12:00:00"), "EEE, dd/MM", { locale: ptBR });

  const copyPhone = () => {
    if (!appt.client_phone) return toast.error("Sem telefone.");
    navigator.clipboard.writeText(appt.client_phone); toast.success("Copiado.");
  };
  const waMsg = `Olá ${appt.client_name}, sobre seu agendamento em ${dateFmt} às ${appt.appointment_time}.`;
  const copyLink = () => { navigator.clipboard.writeText(buildClientLink(appt.access_token)); toast.success("Link copiado."); };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-serif text-lg">{appt.client_name}</p>
          <p className="text-sm text-muted-foreground">{dateFmt} • {appt.appointment_time}</p>
        </div>
        <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider", STATUS_COLOR[appt.status])}>
          {STATUS_LABEL[appt.status]}
        </span>
      </div>

      <p className="text-sm bg-background border border-border rounded-md p-3">{appt.cut_type}</p>

      {appt.agreed_price != null && (
        <p className="text-sm text-primary font-medium">Valor: R$ {Number(appt.agreed_price).toFixed(2)}</p>
      )}
      {appt.notes && <p className="text-xs text-muted-foreground">Obs: {appt.notes}</p>}

      <div className="flex flex-wrap gap-2 pt-1">
        {appt.client_phone && (
          <Button size="sm" variant="outline" onClick={() => window.open(buildWhatsappUrl(appt.client_phone!, waMsg), "_blank")}>
            <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
          </Button>
        )}
        {appt.client_phone && <Button size="sm" variant="outline" onClick={copyPhone}><Copy className="h-3.5 w-3.5 mr-1" />Copiar nº</Button>}
        <Button size="sm" variant="outline" onClick={copyLink}>Copiar link cliente</Button>

        <Select value={appt.status} onValueChange={(v) => onStatus(appt.id, v as AppointmentStatus)}>
          <SelectTrigger className="h-8 w-auto text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
          </SelectContent>
        </Select>

        <Dialog>
          <DialogTrigger asChild><Button size="sm" variant="outline"><DollarSign className="h-3.5 w-3.5 mr-1" />Valor / Obs</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Definir valor e observações</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Valor (R$)</Label><Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="80,00" /></div>
              <div><Label>Observações</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            </div>
            <DialogFooter><Button onClick={() => onPrice(appt.id, price, notes)} className="bg-gradient-gold text-primary-foreground">Salvar</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild><Button size="sm" variant="outline"><RefreshCw className="h-3.5 w-3.5 mr-1" />Remarcar</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Remarcar</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Popover>
                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start"><CalendarIcon className="h-4 w-4 mr-2" />{rDate ? format(rDate, "dd/MM/yyyy") : "Nova data"}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={rDate} onSelect={setRDate} className={cn("p-3 pointer-events-auto")} /></PopoverContent>
              </Popover>
              <div><Label>Novo horário</Label><Input value={rTime} onChange={(e) => setRTime(e.target.value)} placeholder="14:00" /></div>
            </div>
            <DialogFooter><Button disabled={!rDate || !rTime} onClick={() => onReschedule(appt.id, rDate!, rTime)} className="bg-gradient-gold text-primary-foreground">Confirmar</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {appt.status !== "cancelado" && appt.status !== "concluido" && (
          <Dialog>
            <DialogTrigger asChild><Button size="sm" variant="outline" className="border-destructive/40 text-destructive"><XCircle className="h-3.5 w-3.5 mr-1" />Cancelar</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Cancelar agendamento</DialogTitle><DialogDescription>O horário será liberado.</DialogDescription></DialogHeader>
              <Textarea placeholder="Motivo (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} />
              <DialogFooter><Button variant="destructive" onClick={() => onCancel(appt.id, reason || "Cancelado pelo barbeiro")}>Confirmar cancelamento</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
