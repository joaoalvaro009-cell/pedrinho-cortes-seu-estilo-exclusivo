import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Mode = "signin" | "signup" | "forgot";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/admin/reset-password`,
        });
        if (error) { toast.error(error.message); return; }
        toast.success("Enviamos um link de recuperação para seu e-mail.");
        setMode("signin");
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
            // tenta logar direto (auto-confirm está habilitado)
            await supabase.auth.signInWithPassword({ email, password });
            navigate("/admin");
          } else {
            toast.error("Já existe um admin. Use 'Esqueci a senha' se for você.");
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

  const title = mode === "signin" ? "Painel do Barbeiro" : mode === "signup" ? "Criar conta admin" : "Recuperar senha";
  const subtitle = mode === "signin" ? "Área restrita" : mode === "signup" ? "Primeiro acesso" : "Enviaremos um link para seu e-mail";
  const cta = mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta admin" : "Enviar link de recuperação";

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
            {mode !== "forgot" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  {mode === "signin" && (
                    <button type="button" onClick={() => setMode("forgot")} className="text-xs text-primary hover:underline">
                      Esqueci a senha
                    </button>
                  )}
                </div>
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-background" />
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
              <button onClick={() => setMode("signin")} className="block w-full text-xs text-muted-foreground hover:text-primary">
                Já tem conta? Entrar
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminLogin;
