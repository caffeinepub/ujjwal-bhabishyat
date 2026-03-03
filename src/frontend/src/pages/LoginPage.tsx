import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { loginWithUser } from "../utils/auth";

interface LoginPageProps {
  onLogin: () => void;
}

type ActiveTab = "login" | "register";

export default function LoginPage({ onLogin }: LoginPageProps) {
  const { actor } = useActor();
  const [activeTab, setActiveTab] = useState<ActiveTab>("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [isRegLoading, setIsRegLoading] = useState(false);
  const [newUserId, setNewUserId] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) {
      toast.error("সংযোগ স্থাপন হচ্ছে, একটু অপেক্ষা করুন...");
      return;
    }
    setIsLoginLoading(true);
    try {
      const user = await actor.loginUser(loginEmail.trim(), loginPhone.trim());
      if (user) {
        loginWithUser(user);
        toast.success(`স্বাগতম, ${user.name}!`);
        onLogin();
      } else {
        toast.error("ইমেইল বা ফোন নম্বর মিলছে না। আবার চেষ্টা করুন।");
      }
    } catch {
      toast.error("লগইন ব্যর্থ হয়েছে। পরে আবার চেষ্টা করুন।");
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) {
      toast.error("সংযোগ স্থাপন হচ্ছে, একটু অপেক্ষা করুন...");
      return;
    }
    setIsRegLoading(true);
    try {
      // Seed admin silently
      try {
        await actor.setupAdmin(
          "Dipak De",
          "dipakde@ujjwalbhabishyat.com",
          "+919064934476",
        );
      } catch {
        // Idempotent — ignore errors
      }

      const userId = await actor.registerUser(
        regName.trim(),
        regEmail.trim(),
        regPhone.trim(),
      );
      setNewUserId(userId);
      toast.success("নিবন্ধন সফল হয়েছে!");
      // Auto-switch to login after 3s
      setTimeout(() => {
        setNewUserId(null);
        setActiveTab("login");
        setLoginEmail(regEmail.trim());
        setLoginPhone(regPhone.trim());
      }, 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (
        msg.toLowerCase().includes("already") ||
        msg.toLowerCase().includes("exist")
      ) {
        toast.error("এই ইমেইল বা ফোন নম্বর আগেই নিবন্ধিত আছে।");
      } else {
        toast.error("নিবন্ধন ব্যর্থ হয়েছে। পরে আবার চেষ্টা করুন।");
      }
    } finally {
      setIsRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, oklch(0.45 0.2 265 / 0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, oklch(0.48 0.18 245 / 0.07) 0%, transparent 50%)",
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-1 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, oklch(0.45 0.2 265), oklch(0.48 0.18 245))",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-2xl shadow-card-hover border border-border overflow-hidden">
          {/* Header */}
          <div
            className="px-8 pt-8 pb-6 text-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.18 0.04 265) 0%, oklch(0.25 0.06 270) 100%)",
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-4"
            >
              <BookOpen className="w-7 h-7 text-white" />
            </motion.div>
            <h1 className="font-display font-bold text-xl text-white">
              Ujjwal Bhabishyat
            </h1>
            <p className="text-sm text-white/60 mt-1">কোচিং ম্যানেজমেন্ট সিস্টেম</p>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as ActiveTab)}
            className="w-full"
          >
            <div className="px-8 pt-5">
              <TabsList className="w-full h-10">
                <TabsTrigger
                  value="login"
                  data-ocid="login.tab"
                  className="flex-1 text-sm font-medium"
                >
                  লগইন
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  data-ocid="register.tab"
                  className="flex-1 text-sm font-medium"
                >
                  নিবন্ধন
                </TabsTrigger>
              </TabsList>
            </div>

            {/* LOGIN TAB */}
            <TabsContent value="login" className="px-8 pb-7 pt-4 mt-0">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="login-email"
                    className="text-sm font-medium text-foreground/80"
                  >
                    ইমেইল আইডি
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      data-ocid="login.email_input"
                      type="email"
                      placeholder="example@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      autoComplete="email"
                      required
                      className="h-11 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="login-phone"
                    className="text-sm font-medium text-foreground/80"
                  >
                    ফোন নম্বর
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-phone"
                      data-ocid="login.phone_input"
                      type="tel"
                      placeholder="+91XXXXXXXXXX"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      autoComplete="tel"
                      required
                      className="h-11 pl-10"
                    />
                  </div>
                </div>

                <Button
                  data-ocid="login.submit_button"
                  type="submit"
                  className="w-full h-11 font-semibold text-sm mt-2"
                  disabled={isLoginLoading}
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.45 0.2 265), oklch(0.38 0.22 285))",
                  }}
                >
                  {isLoginLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      লগইন হচ্ছে...
                    </>
                  ) : (
                    "লগইন করুন"
                  )}
                </Button>
              </form>

              <p className="text-xs text-center text-muted-foreground mt-4">
                অ্যাকাউন্ট নেই?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className="text-primary underline hover:no-underline"
                >
                  নিবন্ধন করুন
                </button>
              </p>
            </TabsContent>

            {/* REGISTER TAB */}
            <TabsContent value="register" className="px-8 pb-7 pt-4 mt-0">
              <AnimatePresence mode="wait">
                {newUserId ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    data-ocid="register.userid_success"
                    className="flex flex-col items-center text-center py-4 space-y-4"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: "oklch(0.55 0.15 145 / 0.15)" }}
                    >
                      <CheckCircle2
                        className="w-8 h-8"
                        style={{ color: "oklch(0.52 0.17 145)" }}
                      />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-foreground mb-1">
                        নিবন্ধন সফল!
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        আপনার User ID তৈরি হয়েছে
                      </p>
                    </div>
                    <div
                      className="w-full rounded-xl border-2 px-5 py-4"
                      style={{
                        background: "oklch(0.45 0.2 265 / 0.08)",
                        borderColor: "oklch(0.45 0.2 265 / 0.3)",
                      }}
                    >
                      <p className="text-xs text-muted-foreground mb-1">
                        আপনার User ID:
                      </p>
                      <p className="font-mono font-bold text-xl text-foreground tracking-wider">
                        {newUserId}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      ⚠️ এটি লিখে রাখুন — লগইন করতে লাগবে।
                      <br />
                      <span style={{ color: "oklch(0.52 0.17 145)" }}>
                        ৩ সেকেন্ড পরে লগইন পেজে যাচ্ছেন...
                      </span>
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleRegister}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="reg-name"
                        className="text-sm font-medium text-foreground/80"
                      >
                        আপনার নাম
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="reg-name"
                          data-ocid="register.name_input"
                          type="text"
                          placeholder="পুরো নাম লিখুন"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          autoComplete="name"
                          required
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="reg-email"
                        className="text-sm font-medium text-foreground/80"
                      >
                        ইমেইল আইডি
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="reg-email"
                          data-ocid="register.email_input"
                          type="email"
                          placeholder="example@email.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          autoComplete="email"
                          required
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="reg-phone"
                        className="text-sm font-medium text-foreground/80"
                      >
                        ফোন নম্বর
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="reg-phone"
                          data-ocid="register.phone_input"
                          type="tel"
                          placeholder="+91XXXXXXXXXX"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          autoComplete="tel"
                          required
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>

                    <Button
                      data-ocid="register.submit_button"
                      type="submit"
                      className="w-full h-11 font-semibold text-sm mt-2"
                      disabled={isRegLoading}
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.45 0.2 265), oklch(0.38 0.22 285))",
                      }}
                    >
                      {isRegLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          নিবন্ধন হচ্ছে...
                        </>
                      ) : (
                        "নিবন্ধন করুন"
                      )}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>

              {!newUserId && (
                <p className="text-xs text-center text-muted-foreground mt-4">
                  আগেই অ্যাকাউন্ট আছে?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="text-primary underline hover:no-underline"
                  >
                    লগইন করুন
                  </button>
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
