import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Database, Eye, EyeOff, Loader2, RotateCcw, ShieldAlert, ShieldCheck } from "lucide-react";
import { z } from "zod";
import {
  checkRateLimit,
  checkPasswordStrength,
  securityCheck,
  logSecurityEvent,
} from "@/lib/security";
import { clearCacheAndReload } from "@/lib/pwaRecovery";

// SECURITY: Enhanced auth schema with stricter validation
const authSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(255, "Email too long")
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
  fullName: z
    .string()
    .max(100, "Name too long")
    .optional()
    .transform((val) => val?.trim()),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; security?: string }>({});
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string[] }>({ score: 0, feedback: [] });
  const [loginAttempts, setLoginAttempts] = useState(0);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleClearCacheAndReload = async () => {
    toast({
      title: "Limpando cache…",
      description: "Vamos recarregar a página para destravar possíveis travamentos.",
    });
    await clearCacheAndReload({ reason: "manual_auth" });
  };
  // SECURITY: Rate limiting for auth attempts
  const checkAuthRateLimit = useCallback(() => {
    const rateLimitKey = `auth_${email.toLowerCase()}`;
    const result = checkRateLimit(rateLimitKey, 5, 300000); // 5 attempts per 5 minutes
    
    if (!result.allowed) {
      logSecurityEvent({
        type: "RATE_LIMIT",
        details: { email, endpoint: "auth" },
      });
      return { allowed: false, retryIn: Math.ceil(result.resetIn / 1000) };
    }
    return { allowed: true };
  }, [email]);

  // SECURITY: Input validation with security checks
  const validateForm = () => {
    const fieldErrors: typeof errors = {};
    
    // SECURITY: Check for injection attempts
    const emailCheck = securityCheck(email);
    const passwordCheck = securityCheck(password);
    const nameCheck = fullName ? securityCheck(fullName) : { isSafe: true, threats: [] };
    
    if (!emailCheck.isSafe || !passwordCheck.isSafe || !nameCheck.isSafe) {
      const threats = [...emailCheck.threats, ...passwordCheck.threats, ...nameCheck.threats];
      logSecurityEvent({
        type: "SUSPICIOUS",
        input: email,
        details: { threats, endpoint: "auth" },
      });
      fieldErrors.security = "Invalid input detected";
      setErrors(fieldErrors);
      return false;
    }
    
    try {
      authSchema.parse({ email, password, fullName });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          if (err.path[0] === "email") fieldErrors.email = err.message;
          if (err.path[0] === "password") fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  // SECURITY: Handle password change with strength check
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (!isLogin && value.length > 0) {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // SECURITY: Check rate limiting before attempting auth
    const rateLimit = checkAuthRateLimit();
    if (!rateLimit.allowed) {
      toast({
        title: "Too many attempts",
        description: `Please wait ${rateLimit.retryIn} seconds before trying again.`,
        variant: "destructive",
      });
      return;
    }
    
    // SECURITY: Password strength check for signup
    if (!isLogin && passwordStrength.score < 2) {
      toast({
        title: "Weak password",
        description: "Please use a stronger password.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email.toLowerCase().trim(), password);
        if (error) {
          setLoginAttempts((prev) => prev + 1);
          
          // SECURITY: Log failed login attempts
          if (loginAttempts >= 3) {
            logSecurityEvent({
              type: "AUTH_FAILURE",
              details: { email, attempts: loginAttempts + 1 },
            });
          }
          
          // SECURITY: Generic error message to prevent enumeration
          toast({
            title: "Login failed",
            description: "Invalid email or password. Please try again.",
            variant: "destructive",
          });
        } else {
          setLoginAttempts(0);
          toast({
            title: "Welcome back",
            description: "You have successfully logged in.",
          });
          navigate("/");
        }
      } else {
        const { error } = await signUp(email.toLowerCase().trim(), password, fullName?.trim());
        if (error) {
          // SECURITY: Generic error to prevent email enumeration
          toast({
            title: "Sign up failed",
            description: "Could not create account. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account created",
            description: "Welcome to KillaSpy!",
          });
          navigate("/");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <Database className="h-8 w-8 text-primary" />
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              KillaSpy
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Ad Intelligence Platform
          </p>
        </div>

        {/* Form */}
        <div className="bg-card border border-border/50 rounded-lg p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-medium text-foreground">
              {isLogin ? "Sign in to your account" : "Create your account"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm text-muted-foreground">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="bg-secondary/50"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-secondary/50"
                required
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="••••••••"
                  className="bg-secondary/50 pr-10"
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
              {/* SECURITY: Password strength indicator for signup */}
              {!isLogin && password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Progress value={passwordStrength.score * 25} className="h-1.5" />
                    <span className="text-xs text-muted-foreground">
                      {passwordStrength.score <= 1 ? "Weak" : passwordStrength.score <= 2 ? "Fair" : passwordStrength.score <= 3 ? "Good" : "Strong"}
                    </span>
                    {passwordStrength.score >= 3 ? (
                      <ShieldCheck className="h-3 w-3 text-green-500" />
                    ) : (
                      <ShieldAlert className="h-3 w-3 text-yellow-500" />
                    )}
                  </div>
                </div>
              )}
            </div>

            {errors.security && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" />
                {errors.security}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="space-y-3">
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleClearCacheAndReload}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpar cache e recarregar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
