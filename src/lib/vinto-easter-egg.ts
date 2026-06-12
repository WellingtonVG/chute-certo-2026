const VINTO_MESSAGES = ["nú vei", "nú zé", "ó minha bufunfa"] as const;

export function isVintoUsername(username?: string | null) {
  return username?.trim().toLowerCase() === "vinto";
}

export function getRandomVintoMessage() {
  return VINTO_MESSAGES[Math.floor(Math.random() * VINTO_MESSAGES.length)];
}

type ToastFn = (props: { title: string; description?: string; variant?: "default" | "destructive" }) => void;

export function toastPredictionSaved(
  toast: ToastFn,
  title: string,
  username?: string | null
) {
  toast({ title });
  if (isVintoUsername(username)) {
    toast({ title: getRandomVintoMessage() });
  }
}
