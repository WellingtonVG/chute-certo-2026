import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { ThemeCornerButton } from "@/components/ThemeToggle";
import { DEFAULT_BOLAO_PATH } from "@/lib/bolao-config";
import { ensureDefaultBolaoMembership } from "@/lib/bolao-membership";

/** Convites descontinuados — redireciona para o bolão único */
const Invite = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const go = async () => {
      if (user) {
        await ensureDefaultBolaoMembership(user.id);
        navigate(DEFAULT_BOLAO_PATH, { replace: true });
      } else {
        navigate("/auth", { replace: true });
      }
    };

    go();
  }, [isLoading, user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <ThemeCornerButton />
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default Invite;
