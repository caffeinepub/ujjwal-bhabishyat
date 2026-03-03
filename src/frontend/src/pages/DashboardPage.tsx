import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Calendar,
  GraduationCap,
  IndianRupee,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useGetDashboardStats } from "../hooks/useQueries";
import { useListPayments } from "../hooks/useQueries";

type Page = "dashboard" | "students" | "teachers" | "payments" | "chat";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  index,
}: {
  title: string;
  value: string;
  icon: typeof Users;
  color: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Card
        className="relative overflow-hidden border-border shadow-card hover:shadow-card-hover transition-shadow"
        data-ocid={`dashboard.stats.card.${index + 1}`}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {title}
              </p>
              <p className="text-2xl font-display font-bold text-foreground">
                {value}
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}20` }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60"
            style={{ background: color }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function formatDate(ns: bigint): string {
  const ms = Number(ns) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface DashboardPageProps {
  onNavigate: (page: Page) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: payments, isLoading: paymentsLoading } = useListPayments();

  const recentPayments = payments?.slice(-5).reverse() ?? [];

  return (
    <div data-ocid="dashboard.page" className="p-6 space-y-6 max-w-6xl">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-2"
      >
        <h2 className="font-display font-bold text-2xl text-foreground">
          Dashboard
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </motion.div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Students"
            value={stats?.totalStudents?.toString() ?? "0"}
            icon={Users}
            color="oklch(0.48 0.18 245)"
            index={0}
          />
          <StatCard
            title="Total Teachers"
            value={stats?.totalTeachers?.toString() ?? "0"}
            icon={GraduationCap}
            color="oklch(0.52 0.17 145)"
            index={1}
          />
          <StatCard
            title="Fees This Month"
            value={`₹${Number(stats?.totalFeesCollectedThisMonth ?? 0).toLocaleString("en-IN")}`}
            icon={IndianRupee}
            color="oklch(0.45 0.2 265)"
            index={2}
          />
          <StatCard
            title="Pending Fees"
            value={stats?.pendingCount?.toString() ?? "0"}
            icon={AlertCircle}
            color="oklch(0.6 0.2 45)"
            index={3}
          />
        </div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
          দ্রুত যোগ করুন
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Add Student */}
          <button
            type="button"
            data-ocid="dashboard.add_student_button"
            onClick={() => onNavigate("students")}
            className="group relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed border-blue-400/50 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-400 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 group-hover:bg-blue-500/25 flex items-center justify-center transition-colors">
              <UserPlus className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-sm text-foreground">
                ছাত্র যোগ করুন
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                নতুন শিক্ষার্থী
              </p>
            </div>
          </button>

          {/* Add Teacher */}
          <button
            type="button"
            data-ocid="dashboard.add_teacher_button"
            onClick={() => onNavigate("teachers")}
            className="group relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed border-emerald-400/50 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-400 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 group-hover:bg-emerald-500/25 flex items-center justify-center transition-colors relative">
              <GraduationCap className="w-6 h-6 text-emerald-500" />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                <Plus className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-sm text-foreground">
                মাস্টার যোগ করুন
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">নতুন শিক্ষক</p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Recent Payments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
      >
        <Card className="border-border shadow-card">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-display font-semibold text-base text-foreground">
              Recent Payments
            </h3>
          </div>
          <div className="overflow-x-auto">
            {paymentsLoading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentPayments.length === 0 ? (
              <div className="px-5 py-10 text-center text-muted-foreground text-sm">
                No payments recorded yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Transaction Ref
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((payment, i) => (
                    <tr
                      key={payment.id}
                      className={`table-row-hover transition-colors ${i < recentPayments.length - 1 ? "border-b border-border/60" : ""}`}
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-foreground/70">
                        {payment.transactionRef}
                      </td>
                      <td className="px-5 py-3.5 text-foreground/80">
                        {formatDate(payment.paymentDate)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-foreground">
                        ₹{Number(payment.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge className="badge-paid text-xs font-medium">
                          Paid
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
