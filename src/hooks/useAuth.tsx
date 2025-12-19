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

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // REFATORAÇÃO: Ref para controlar se listener já atualizou o estado
  // Evita race condition entre getSession e onAuthStateChange
  const hasInitializedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      // REFATORAÇÃO: Verifica se componente ainda está montado
      if (!isMountedRef.current) return;

      logger.auth(event, !!currentSession, {
        userId: currentSession?.user?.id,
        email: currentSession?.user?.email,
      });

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
      hasInitializedRef.current = true;
    });

    // THEN check for existing session
    // REFATORAÇÃO: Só atualiza se listener ainda não disparou
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      // Verifica se componente ainda está montado
      if (!isMountedRef.current) return;

      // REFATORAÇÃO: Só atualiza se listener não já fez isso
      // Evita race condition e estado duplicado
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
    });

    return () => {
      isMountedRef.current = false;
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
      value={{ user, session, loading, signUp, signIn, signOut }}
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
