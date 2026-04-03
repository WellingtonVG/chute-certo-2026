import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, signOut } = useAuth();

  // Username
  const [username, setUsername] = useState(profile?.username ?? "");
  const [usernameError, setUsernameError] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleSaveUsername = async () => {
    if (!user) return;
    const trimmed = username.trim().toLowerCase();
    if (trimmed.length < 3) {
      setUsernameError("Username deve ter pelo menos 3 caracteres.");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(trimmed)) {
      setUsernameError("Apenas letras minúsculas, números e underscore.");
      return;
    }
    setUsernameError("");
    setSavingUsername(true);

    const { data: existing } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("username", trimmed)
      .neq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      setUsernameError("Este username já está em uso.");
      setSavingUsername(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ username: trimmed })
      .eq("user_id", user.id);
    setSavingUsername(false);
    if (error) {
      if (error.message.includes("unique") || error.message.includes("duplicate")) {
        setUsernameError("Este username já está em uso.");
      } else {
        toast({ title: "Erro ao salvar username", description: error.message, variant: "destructive" });
      }
    } else {
      await refreshProfile();
      toast({ title: "Username atualizado!" });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "A nova senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    setSavingPassword(true);

    const email = user?.email;
    if (!email) {
      setSavingPassword(false);
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signInError) {
      setSavingPassword(false);
      toast({ title: "Senha atual incorreta.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
    } else {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Senha alterada com sucesso!" });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "EXCLUIR") return;
    setDeleting(true);

    const { error } = await supabase.from("profiles").delete().eq("user_id", user!.id);
    if (error) {
      setDeleting(false);
      toast({ title: "Erro ao excluir conta", description: error.message, variant: "destructive" });
      return;
    }

    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-primary px-4 py-4 text-primary-foreground">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Configurações</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 space-y-6 p-4">
        {/* Username */}
        <section className="space-y-3 rounded-xl border bg-card p-4">
          <h2 className="font-semibold text-card-foreground">Username</h2>
          <div className="space-y-2">
            <Label htmlFor="username">Username (único)</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase());
                setUsernameError("");
              }}
              placeholder="seu_username"
            />
            {usernameError && (
              <p className="text-sm text-destructive">{usernameError}</p>
            )}
          </div>
          <Button onClick={handleSaveUsername} disabled={savingUsername} size="sm">
            {savingUsername && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </section>

        {/* Password */}
        <section className="space-y-3 rounded-xl border bg-card p-4">
          <h2 className="font-semibold text-card-foreground">Alterar senha</h2>
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha atual</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova senha</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
            size="sm"
          >
            {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Alterar senha
          </Button>
        </section>

        {/* Delete Account */}
        <section className="space-y-3 rounded-xl border border-destructive/30 bg-card p-4">
          <h2 className="font-semibold text-destructive">Excluir conta</h2>
          <p className="text-sm text-muted-foreground">
            Esta ação é irreversível. Todos os seus dados serão removidos permanentemente.
          </p>
          <div className="space-y-2">
            <Label htmlFor="deleteConfirm">
              Digite <span className="font-bold">EXCLUIR</span> para confirmar
            </Label>
            <Input
              id="deleteConfirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="EXCLUIR"
            />
          </div>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== "EXCLUIR" || deleting}
            size="sm"
          >
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir minha conta
          </Button>
        </section>
      </main>
    </div>
  );
};

export default Settings;
