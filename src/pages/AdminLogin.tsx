import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Mode = "signin" | "signup" | "reset";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/admin", { replace: true });
    });
  }, [navigate]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "reset") {
        if (password.length < 6) { toast.error("A nova senha precisa ter ao menos 6 caracteres."); return; }
        if (password !== confirmPassword) { toast.error("As senhas não coincidem."); return; }

        const { data, error } = await supabase.functions.invoke("admin-reset-password", {
          body: { email, newPassword: password },
        });
        if (error || (data as any)?.error) {
          toast.error((data as any)?.error || "Não foi possível redefinir a senha.");
          return;
        }
        toast.success("Senha redefinida! Entrando...");
        const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signErr) { toast.error("Senha alterada, mas falhou ao entrar. Tente fazer login."); setMode("signin"); return; }
        navigate("/admin");
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) { toast.error(error.message); return; }
        if (data.user) {
          const { count } = await supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
          if ((count ?? 0) === 0) {
            await supabase.from("user_roles").insert({ user_id: data.user.id, role: "admin" });
            toast.success("Conta admin criada!");
            await supabase.auth.signInWithPassword({ email, password });
            navigate("/admin");
          } else {
            toast.error("Já existe um admin. Use 'Esqueci a senha'.");
            await supabase.auth.signOut();
          }
        }
        return;
      }

      // signin
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { toast.error("E-mail ou senha incorretos."); return; }
      navigate("/admin");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "signin" ? "Painel do Barbeiro" : mode === "signup" ? "Criar conta admin" : "Redefinir senha";
  const subtitle = mode === "signin" ? "Área restrita" : mode === "signup" ? "Primeiro acesso" : "Defina uma nova senha agora mesmo";
  const cta = mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta admin" : "Salvar nova senha e entrar";

  return (
    <main className="min-h-screen bg-gradient-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao site
        </Link>
        <div className="bg-card border border-border rounded-xl p-8 shadow-elegant">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-md bg-gradient-gold flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-2xl">{title}</h1>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          <form onSubmit={handle} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-background" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{mode === "reset" ? "Nova senha" : "Senha"}</Label>
                {mode === "signin" && (
                  <button type="button" onClick={() => { setPassword(""); setConfirmPassword(""); setMode("reset"); }} className="text-xs text-primary hover:underline">
                    Esqueci a senha
                  </button>
                )}
              </div>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-background" />
            </div>

            {mode === "reset" && (
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar nova senha</Label>
                <Input id="confirm" type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 bg-background" />
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {cta}
            </Button>
          </form>

          <div className="mt-4 space-y-2 text-center">
            {mode === "signin" && (
              <button onClick={() => setMode("signup")} className="block w-full text-xs text-muted-foreground hover:text-primary">
                Primeiro acesso? Criar conta admin
              </button>
            )}
            {mode !== "signin" && (
              <button onClick={() => { setPassword(""); setConfirmPassword(""); setMode("signin"); }} className="block w-full text-xs text-muted-foreground hover:text-primary">
                Voltar para o login
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminLogin;
