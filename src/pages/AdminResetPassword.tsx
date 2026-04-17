import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AdminResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase coloca os tokens no hash da URL — checa a sessão criada
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setReady(true);
      } else {
        // Aguarda evento PASSWORD_RECOVERY
        const { data: sub } = supabase.auth.onAuthStateChange((event) => {
          if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
            setReady(true);
          }
        });
        return () => sub.subscription.unsubscribe();
      }
    };
    check();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("A senha precisa ter ao menos 6 caracteres."); return; }
    if (password !== confirm) { toast.error("As senhas não coincidem."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Senha alterada! Faça login novamente.");
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-gradient-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/admin/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao login
        </Link>
        <div className="bg-card border border-border rounded-xl p-8 shadow-elegant">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-md bg-gradient-gold flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-2xl">Nova senha</h1>
              <p className="text-xs text-muted-foreground">Defina sua senha de acesso</p>
            </div>
          </div>

          {!ready ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Validando link de recuperação... Se nada aparecer em alguns segundos, solicite um novo link.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <Input id="confirm" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-12 bg-background" />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar nova senha
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
};

export default AdminResetPassword;
