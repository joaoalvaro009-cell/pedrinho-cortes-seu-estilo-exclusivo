import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, UserCog } from "lucide-react";
import { toast } from "sonner";

export const AccountSettingsDialog = () => {
  const [open, setOpen] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPwd, setLoadingPwd] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.auth.getUser().then(({ data }) => {
      setCurrentEmail(data.user?.email ?? "");
      setNewEmail(data.user?.email ?? "");
    });
  }, [open]);

  const updateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || newEmail === currentEmail) { toast.error("Informe um novo e-mail diferente."); return; }
    setLoadingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setLoadingEmail(false);
    if (error) { toast.error(error.message); return; }
    toast.success("E-mail atualizado. Pode ser necessário confirmar pelo link enviado ao novo endereço.");
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error("A senha precisa ter ao menos 6 caracteres."); return; }
    if (newPassword !== confirmPassword) { toast.error("As senhas não coincidem."); return; }
    setLoadingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoadingPwd(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Senha atualizada com sucesso!");
    setNewPassword(""); setConfirmPassword("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserCog className="h-4 w-4" /> Minha conta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Minha conta</DialogTitle>
          <DialogDescription>Altere seu e-mail e senha de acesso ao painel.</DialogDescription>
        </DialogHeader>

        <form onSubmit={updateEmail} className="space-y-3 border-b border-border pb-5">
          <h3 className="text-sm font-semibold">Alterar e-mail</h3>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">E-mail atual</Label>
            <Input value={currentEmail} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newEmail">Novo e-mail</Label>
            <Input id="newEmail" type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </div>
          <Button type="submit" disabled={loadingEmail} className="w-full">
            {loadingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar novo e-mail
          </Button>
        </form>

        <form onSubmit={updatePassword} className="space-y-3 pt-2">
          <h3 className="text-sm font-semibold">Alterar senha</h3>
          <div className="space-y-2">
            <Label htmlFor="newPwd">Nova senha</Label>
            <Input id="newPwd" type="password" minLength={6} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPwd">Confirmar senha</Label>
            <Input id="confirmPwd" type="password" minLength={6} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loadingPwd} className="w-full">
            {loadingPwd && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar nova senha
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
