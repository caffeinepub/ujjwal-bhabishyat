import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, CheckCircle2, Loader2, Phone, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Student } from "../backend.d";
import { PaymentStatus } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { loginWithUser } from "../utils/auth";

const ADMIN_PHONE = "+919064934476";

interface LoginPageProps {
  onLogin: () => void;
}

type ActiveTab = "login" | "register";

export default function LoginPage({ onLogin }: LoginPageProps) {
  const { actor } = useActor();
  const [activeTab, setActiveTab] = useState<ActiveTab>("login");

  // Login state — নাম + ফোন নম্বর
  const [loginName, setLoginName] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [isRegLoading, setIsRegLoading] = useState(false);
  const [newUserId, setNewUserId] = useState<string | null>(null);

  // Seed admin once — email ফিল্ডে name পাঠাচ্ছি যাতে loginUser(name, phone) দিয়ে মিলানো যায়
  const seedAdmin = async () => {
    try {
      await actor!.setupAdmin(
        "Dipak De",
        "Dipak De", // email ফিল্ডে name রাখছি
        ADMIN_PHONE,
      );
    } catch {
      // Idempotent
    }
  };

  // ফোন নম্বর নর্মালাইজ: +91 ছাড়া 10 ডিজিট দিলে +91 যোগ করো
  const normalizePhone = (phone: string): string => {
    const p = phone.trim();
    if (p.startsWith("+")) return p;
    if (p.length === 10) return `+91${p}`;
    if (p.startsWith("91") && p.length === 12) return `+${p}`;
    return p;
  };

  // লগইন: নাম + ফোন নম্বর দিয়ে
  // ব্যাকেন্ড loginUser(email, phone) — email-এর জায়গায় name পাঠাচ্ছি
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) {
      toast.error("সংযোগ স্থাপন হচ্ছে, একটু অপেক্ষা করুন...");
      return;
    }
    setIsLoginLoading(true);
    try {
      await seedAdmin();
      const trimName = loginName.trim();
      const trimPhone = normalizePhone(loginPhone);
      // loginUser(email=name, phone) — name দিয়ে email ফিল্ড মিলাচ্ছি
      const user = await actor.loginUser(trimName, trimPhone);
      if (user) {
        loginWithUser(user);
        toast.success(`স্বাগতম, ${user.name}!`);
        onLogin();
      } else {
        toast.error(
          "নাম বা ফোন নম্বর মিলছে না। প্রথমে 'নিবন্ধন' ট্যাবে গিয়ে নিবন্ধন করুন।",
        );
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
      const trimName = regName.trim();
      const trimPhone = normalizePhone(regPhone);

      // অ্যাডমিন ফোন দিলে seedAdmin করো, তারপর সরাসরি লগইনে যাও
      if (trimPhone === ADMIN_PHONE) {
        await seedAdmin();
        // admin হিসেবে সরাসরি লগইন করানোর জন্য User ID দেখাও
        setNewUserId("ADMIN");
        toast.success("অ্যাডমিন অ্যাকাউন্ট প্রস্তুত!");
        setTimeout(() => {
          setNewUserId(null);
          setActiveTab("login");
          setLoginName(trimName);
          setLoginPhone(trimPhone);
        }, 3000);
        return;
      }

      // সাধারণ ব্যবহারকারী নিবন্ধন
      let userId: string;
      try {
        userId = await actor.registerUser(trimName, trimName, trimPhone);
      } catch (err) {
        const msg = String(err);
        if (
          msg.toLowerCase().includes("already") ||
          msg.toLowerCase().includes("exist") ||
          msg.toLowerCase().includes("phone")
        ) {
          // ইতিমধ্যে নিবন্ধিত -- লগইন ট্যাবে পাঠাও
          toast.info("এই ফোন নম্বর আগেই নিবন্ধিত আছে। সরাসরি লগইন করুন।");
          setActiveTab("login");
          setLoginName(trimName);
          setLoginPhone(trimPhone);
          return;
        }
        throw err;
      }

      setNewUserId(userId);
      toast.success("নিবন্ধন সফল হয়েছে!");

      // ছাত্র তালিকায় স্বয়ংক্রিয়ভাবে যোগ করো
      try {
        const now = BigInt(Date.now()) * 1_000_000n;
        const studentData: Student = {
          id: crypto.randomUUID(),
          name: trimName,
          className: "",
          parentName: "",
          parentPhone: trimPhone,
          feeAmount: 0n,
          paymentStatus: PaymentStatus.Unpaid,
          enrolledDate: now,
          studentEmail: "",
          guardianName: "",
          guardianEmail: "",
        };
        await actor.addStudent(studentData);
      } catch {
        // ছাত্র যোগ ব্যর্থ হলেও নিবন্ধন সফল
      }

      // ৩ সেকেন্ড পরে লগইন ট্যাবে যাও
      setTimeout(() => {
        setNewUserId(null);
        setActiveTab("login");
        setLoginName(trimName);
        setLoginPhone(trimPhone);
      }, 3000);
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("নিবন্ধন ব্যর্থ হয়েছে। নাম ও ফোন নম্বর ঠিকমতো দিয়ে আবার চেষ্টা করুন।");
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
            <p className="text-xs text-white/40 mt-1">
              প্রথমে নিবন্ধন করুন, তারপর লগইন করুন
            </p>
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
                    htmlFor="login-name"
                    className="text-sm font-medium text-foreground/80"
                  >
                    আপনার নাম
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-name"
                      data-ocid="login.name_input"
                      type="text"
                      placeholder="পুরো নাম লিখুন"
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                      autoComplete="name"
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
                      placeholder="+91XXXXXXXXXX বা 10 ডিজিট"
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

              <div
                className="mt-4 rounded-lg px-3 py-2.5"
                style={{
                  background: "oklch(0.55 0.17 35 / 0.08)",
                  border: "1px solid oklch(0.55 0.17 35 / 0.2)",
                }}
              >
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span
                    className="font-semibold"
                    style={{ color: "oklch(0.55 0.17 35)" }}
                  >
                    ⚠ প্রথমবার?
                  </span>{" "}
                  আগে <strong>"নিবন্ধন"</strong> ট্যাবে গিয়ে নিজের নাম ও ফোন নম্বর
                  দিয়ে অ্যাকাউন্ট তৈরি করুন। তারপর এখানে লগইন করুন।
                </p>
              </div>
              <div
                className="mt-2 rounded-lg px-3 py-2.5"
                style={{
                  background: "oklch(0.45 0.2 265 / 0.07)",
                  border: "1px solid oklch(0.45 0.2 265 / 0.15)",
                }}
              >
                <p className="text-xs text-muted-foreground leading-relaxed">
                  শুধুমাত্র{" "}
                  <span
                    className="font-semibold"
                    style={{ color: "oklch(0.55 0.18 265)" }}
                  >
                    দীপক দে
                  </span>{" "}
                  (অ্যাডমিন) সব ফিচার ব্যবহার করতে পারবেন। বাকি ছাত্ররা ড্যাশবোর্ড দেখতে পাবে।
                </p>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-3">
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
                    {newUserId !== "ADMIN" && (
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
                    )}
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {newUserId === "ADMIN"
                        ? "অ্যাডমিন অ্যাকাউন্ট প্রস্তুত। এখন লগইন করুন।"
                        : "⚠️ এটি লিখে রাখুন — লগইন করতে লাগবে।"}
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
                          placeholder="+91XXXXXXXXXX বা 10 ডিজিট"
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
                <>
                  <div
                    className="mt-3 rounded-lg px-3 py-2.5"
                    style={{
                      background: "oklch(0.52 0.17 145 / 0.07)",
                      border: "1px solid oklch(0.52 0.17 145 / 0.2)",
                    }}
                  >
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <span
                        className="font-semibold"
                        style={{ color: "oklch(0.52 0.17 145)" }}
                      >
                        কিভাবে করবেন:
                      </span>{" "}
                      নিজের পুরো নাম ও ফোন নম্বর (+91XXXXXXXXXX বা শুধু 10 ডিজিট) দিয়ে
                      নিবন্ধন করুন। নিবন্ধনের পরে সেই একই নাম ও ফোন দিয়ে লগইন করুন।
                    </p>
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    আগেই অ্যাকাউন্ট আছে?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("login")}
                      className="text-primary underline hover:no-underline"
                    >
                      লগইন করুন
                    </button>
                  </p>
                </>
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
