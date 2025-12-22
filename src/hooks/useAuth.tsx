import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isReconnecting: boolean;
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: Error | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Retry com backoff exponencial
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt); // 1s, 2s, 4s
        logger.warn("AUTH", `Retry attempt ${attempt + 1}/${maxRetries}`, { 
          delay: `${delay}ms`,
          error: lastError.message 
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Refs para controle de estado
  const hasInitializedRef = useRef(false);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;

    // SAFETY: Timeout para garantir que loading nunca fica preso
    const safetyTimeout = setTimeout(() => {
      if (isMountedRef.current && !hasInitializedRef.current) {
        logger.warn("AUTH", "Safety timeout triggered - starting reconnection");
        setIsReconnecting(true);
        
        toast({
          title: "Reconectando...",
          description: "Tentando restabelecer conexão com o servidor.",
          variant: "default",
        });

        // Tentar reconectar com retry
        retryWithBackoff(async () => {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          return data.session;
        }, 3, 1000)
          .then((session) => {
            if (!isMountedRef.current) return;
            
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            setIsReconnecting(false);
            hasInitializedRef.current = true;
            retryCountRef.current = 0;

            toast({
              title: "Conexão restabelecida",
              description: "Você está conectado novamente.",
              variant: "default",
            });
          })
          .catch(() => {
            if (!isMountedRef.current) return;
            
            setSession(null);
            setUser(null);
            setLoading(false);
            setIsReconnecting(false);
            hasInitializedRef.current = true;

            toast({
              title: "Falha na conexão",
              description: "Não foi possível conectar. Faça login novamente.",
              variant: "destructive",
            });
          });
      }
    }, 5000); // 5 segundos antes de iniciar retry

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!isMountedRef.current) return;

      logger.auth(event, !!currentSession, {
        userId: currentSession?.user?.id,
        email: currentSession?.user?.email,
      });

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
      setIsReconnecting(false);
      hasInitializedRef.current = true;
    });

    // THEN check for existing session with retry
    const initSession = async () => {
      try {
        const result = await retryWithBackoff(async () => {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          return data;
        }, 3, 500);

        const existingSession = result.session;

        if (!isMountedRef.current) return;

        if (!hasInitializedRef.current) {
          setSession(existingSession);
          setUser(existingSession?.user ?? null);
          setLoading(false);
          hasInitializedRef.current = true;
        }

        logger.info("AUTH", "Session check completed", {
          hasSession: !!existingSession,
          userId: existingSession?.user?.id,
        });
      } catch (e) {
        if (!isMountedRef.current) return;

        const error = e instanceof Error ? e : new Error("Unknown error");
        logger.warn("AUTH", "Session check failed after retries", {
          error: error.message,
        });

        if (!hasInitializedRef.current) {
          setSession(null);
          setUser(null);
          setLoading(false);
          hasInitializedRef.current = true;
        }
      }
    };

    void initSession();

    return () => {
      isMountedRef.current = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ error: Error | null }> => {
    logger.info("AUTH", "Sign up attempt", { email });
    const redirectUrl = `${window.location.origin}/`;

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        logger.error("AUTH", "Sign up failed", {
          email,
          error: error.message,
        });
        return { error: error as Error };
      }

      logger.info("AUTH", "Sign up successful", { email });
      return { error: null };
    } catch (e) {
      // REFATORAÇÃO: Tratamento de erro inesperado
      const error = e instanceof Error ? e : new Error("Unknown error");
      logger.error("AUTH", "Sign up exception", { email, error: error.message });
      return { error };
    }
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: Error | null }> => {
    logger.info("AUTH", "Sign in attempt", { email });

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error("AUTH", "Sign in failed", {
          email,
          error: error.message,
        });
        return { error: error as Error };
      }

      logger.info("AUTH", "Sign in successful", { email });
      return { error: null };
    } catch (e) {
      // REFATORAÇÃO: Tratamento de erro inesperado
      const error = e instanceof Error ? e : new Error("Unknown error");
      logger.error("AUTH", "Sign in exception", { email, error: error.message });
      return { error };
    }
  };

  const signOut = async (): Promise<void> => {
    logger.info("AUTH", "Sign out requested");
    try {
      await supabase.auth.signOut();
      logger.info("AUTH", "Sign out completed");
    } catch (e) {
      // REFATORAÇÃO: Log de erro mas não propaga
      const error = e instanceof Error ? e : new Error("Unknown error");
      logger.error("AUTH", "Sign out error", { error: error.message });
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isReconnecting, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
