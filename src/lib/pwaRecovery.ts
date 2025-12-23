type SetupOptions = {
  enabled?: boolean;
};

type ClearOptions = {
  reason?: string;
};

const AUTO_RECOVERY_KEY = "pwa_auto_recovery_attempted_at";

function shouldAutoRecover(): boolean {
  try {
    const raw = sessionStorage.getItem(AUTO_RECOVERY_KEY);
    if (!raw) return true;

    const last = Number(raw);
    if (!Number.isFinite(last)) return true;

    // Evita loop: no máximo 1 tentativa a cada 10 minutos por aba
    return Date.now() - last > 10 * 60 * 1000;
  } catch {
    return true;
  }
}

function markAutoRecoveryAttempt(): void {
  try {
    sessionStorage.setItem(AUTO_RECOVERY_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

function isChunkMismatchMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("loading chunk") ||
    m.includes("chunkloaderror") ||
    m.includes("failed to fetch dynamically imported module") ||
    m.includes("error loading dynamically imported module") ||
    m.includes("importing a module script failed") ||
    m.includes("unable to preload css")
  );
}

function buildRecoveryUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.set("__pwa_recovered", "1");
  url.searchParams.set("__ts", String(Date.now()));
  return url.toString();
}

export async function clearCacheAndReload(options: ClearOptions = {}): Promise<void> {
  // Removemos SW + CacheStorage (não mexe no IndexedDB/offlineDb)
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
    }

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } finally {
    // Se o problema for chunks antigos em cache, trocar a URL ajuda a forçar reload limpo
    window.location.replace(buildRecoveryUrl());
  }
}

export function setupPwaAutoRecovery({ enabled = true }: SetupOptions = {}): void {
  if (!enabled) return;
  if (typeof window === "undefined") return;

  const attemptAutoRecovery = async (reason: string) => {
    if (!shouldAutoRecover()) return;
    markAutoRecoveryAttempt();

    // Evita qualquer chance de loop imediato em caso de falha persistente
    await clearCacheAndReload({ reason });
  };

  const handleUnknownError = (maybeMessage: unknown) => {
    const msg = typeof maybeMessage === "string" ? maybeMessage : "";
    if (msg && isChunkMismatchMessage(msg)) {
      void attemptAutoRecovery("chunk_mismatch");
    }
  };

  // 1) Erros típicos de lazy import/chunk
  window.addEventListener(
    "error",
    (event) => {
      const message =
        (event as ErrorEvent).message ||
        ((event as ErrorEvent).error instanceof Error ? (event as ErrorEvent).error.message : "");

      if (message && isChunkMismatchMessage(message)) {
        void attemptAutoRecovery("chunk_error");
      }
    },
    true
  );

  window.addEventListener(
    "unhandledrejection",
    (event) => {
      const reason = (event as PromiseRejectionEvent).reason;
      const message = reason instanceof Error ? reason.message : String(reason ?? "");
      handleUnknownError(message);
    },
    true
  );

  // 2) Detecta SW quebrado servindo HTML (muito comum quando alguém tenta registrar SW no dev)
  //    Faz no máximo 1 tentativa por aba para não gerar loop.
  void (async () => {
    if (!("serviceWorker" in navigator)) return;

    const regs = await navigator.serviceWorker.getRegistrations();
    if (!regs.length) return;

    try {
      const res = await fetch("/sw.js", { cache: "no-store" });
      const contentType = res.headers.get("content-type") || "";

      if (res.ok && contentType.toLowerCase().includes("text/html")) {
        await attemptAutoRecovery("sw_mime_text_html");
      }
    } catch {
      // ignore
    }
  })();
}
