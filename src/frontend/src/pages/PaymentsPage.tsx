import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Calendar,
  IndianRupee,
  MessageSquare,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { PaymentStatus } from "../backend.d";
import { useListPayments, useListStudents } from "../hooks/useQueries";
import { isAdmin } from "../utils/auth";

function StatusBadge({ status }: { status: PaymentStatus }) {
  const cls =
    status === PaymentStatus.Paid
      ? "badge-paid"
      : status === PaymentStatus.Unpaid
        ? "badge-unpaid"
        : "badge-pending";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      {status}
    </span>
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

function AccessDenied({ pageName }: { pageName: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "oklch(0.55 0.2 25 / 0.12)" }}
      >
        <svg
          className="w-8 h-8"
          style={{ color: "oklch(0.52 0.22 25)" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          role="img"
          aria-label="লক আইকন"
        >
          <title>লক আইকন</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </div>
      <h2 className="font-display font-bold text-xl text-foreground mb-2">
        অ্যাক্সেস নেই
      </h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        {pageName} পেজটি শুধুমাত্র অ্যাডমিনের জন্য। আপনার অ্যাকাউন্টে এই পেজ দেখার অনুমতি নেই।
      </p>
    </div>
  );
}

function PaymentsPageContent() {
  const { data: allStudents = [], isLoading: studentsLoading } =
    useListStudents();
  const { data: payments = [], isLoading: paymentsLoading } = useListPayments();

  const pendingStudents = allStudents.filter(
    (s) =>
      s.paymentStatus === PaymentStatus.Unpaid ||
      s.paymentStatus === PaymentStatus.Pending,
  );

  const handleSendSMS = (parentName: string, parentPhone: string) => {
    toast.success(`SMS reminder sent to ${parentName} at ${parentPhone}`, {
      duration: 4000,
      description: "Tuition fee reminder message dispatched.",
    });
  };

  const totalPending = pendingStudents.reduce(
    (sum, s) => sum + Number(s.feeAmount),
    0,
  );

  return (
    <div data-ocid="payments.page" className="p-6 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground">
            Pending Fees
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pendingStudents.length} students with outstanding fees
          </p>
        </div>
        {pendingStudents.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 text-right">
            <p className="text-xs text-orange-600 font-medium uppercase tracking-wider">
              Total Pending
            </p>
            <p className="text-lg font-display font-bold text-orange-700">
              ₹{totalPending.toLocaleString("en-IN")}
            </p>
          </div>
        )}
      </motion.div>

      {/* Pending Students Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="border-border shadow-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2 bg-muted/30">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <h3 className="font-display font-semibold text-sm text-foreground">
              Pending / Unpaid Students
            </h3>
          </div>
          <div className="overflow-x-auto">
            {studentsLoading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : pendingStudents.length === 0 ? (
              <div
                className="py-14 text-center text-muted-foreground"
                data-ocid="payments.empty_state"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 flex items-center justify-center">
                  <IndianRupee className="w-6 h-6 text-green-500" />
                </div>
                <p className="font-medium text-green-600">All fees cleared!</p>
                <p className="text-sm mt-1">
                  No pending or unpaid fees at this time.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                      Class
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                      Parent Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                      Parent Phone
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Fee (₹)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingStudents.map((student, i) => (
                    <tr
                      key={student.id}
                      data-ocid={`payments.item.${i + 1}`}
                      className={`table-row-hover transition-colors ${i < pendingStudents.length - 1 ? "border-b border-border/60" : ""}`}
                    >
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-medium text-foreground">
                            {student.name}
                          </p>
                          <p className="text-xs text-muted-foreground sm:hidden">
                            {student.className}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-foreground/80 hidden sm:table-cell">
                        {student.className}
                      </td>
                      <td className="px-4 py-3.5 text-foreground/80 hidden md:table-cell">
                        {student.parentName}
                      </td>
                      <td className="px-4 py-3.5 text-foreground/80 hidden md:table-cell">
                        {student.parentPhone}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-foreground">
                        ₹{Number(student.feeAmount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={student.paymentStatus} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          data-ocid={`payments.sms_button.${i + 1}`}
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                          onClick={() =>
                            handleSendSMS(
                              student.parentName,
                              student.parentPhone,
                            )
                          }
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">SMS Reminder</span>
                          <span className="sm:hidden">SMS</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Payment History */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-border shadow-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2 bg-muted/30">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-display font-semibold text-sm text-foreground">
              Payment History
            </h3>
            <span className="ml-auto text-xs text-muted-foreground">
              {payments.length} records
            </span>
          </div>
          <div className="overflow-x-auto">
            {paymentsLoading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : payments.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-25" />
                No payment records yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Transaction Ref
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                      Note
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...payments].reverse().map((payment, i) => (
                    <tr
                      key={payment.id}
                      className={`table-row-hover transition-colors ${i < payments.length - 1 ? "border-b border-border/60" : ""}`}
                    >
                      <td className="px-4 py-3.5 font-mono text-xs text-foreground/70">
                        {payment.transactionRef}
                      </td>
                      <td className="px-4 py-3.5 text-foreground/80 hidden sm:table-cell text-xs">
                        {payment.note.replace("Tuition fee for ", "")}
                      </td>
                      <td className="px-4 py-3.5 text-foreground/60 hidden md:table-cell text-xs truncate max-w-[160px]">
                        {payment.note}
                      </td>
                      <td className="px-4 py-3.5 text-foreground/80 text-xs">
                        {formatDate(payment.paymentDate)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-foreground">
                        ₹{Number(payment.amount).toLocaleString("en-IN")}
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

export default function PaymentsPage() {
  if (!isAdmin()) return <AccessDenied pageName="ফি ও পেমেন্ট" />;
  return <PaymentsPageContent />;
}
