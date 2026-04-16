import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
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

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      if (error) { toast.error(error.message); setLoading(false); return; }
      // Atribuir admin a este usuário (apenas se for o primeiro)
      if (data.user) {
        const { count } = await supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
        if ((count ?? 0) === 0) {
          await supabase.from("user_roles").insert({ user_id: data.user.id, role: "admin" });
          toast.success("Conta admin criada!");
        } else {
          toast.error("Já existe um admin. Contate o administrador.");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
      }
      navigate("/admin");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { toast.error("E-mail ou senha incorretos."); setLoading(false); return; }
      navigate("/admin");
    }
    setLoading(false);
  };

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
              <h1 className="font-serif text-2xl">Painel do Barbeiro</h1>
              <p className="text-xs text-muted-foreground">Área restrita</p>
            </div>
          </div>

          <form onSubmit={handle} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-background" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Entrar" : "Criar conta admin"}
            </Button>
          </form>

          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="w-full mt-4 text-xs text-muted-foreground hover:text-primary">
            {mode === "signin" ? "Primeiro acesso? Criar conta admin" : "Já tem conta? Entrar"}
          </button>
        </div>
      </div>
    </main>
  );
};

export default AdminLogin;
