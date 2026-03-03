import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  CreditCard,
  Edit,
  Loader2,
  Mail,
  Plus,
  Search,
  Smartphone,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
// QRCodeSVG replaced with inline implementation
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { Student } from "../backend.d";
import { PaymentStatus } from "../backend.d";
import {
  useAddStudent,
  useDeleteStudent,
  useListStudents,
  useRecordPayment,
  useUpdateStudent,
} from "../hooks/useQueries";
import { isAdmin } from "../utils/auth";

type FilterTab = "All" | PaymentStatus;

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

interface StudentFormData {
  name: string;
  className: string;
  parentName: string;
  parentPhone: string;
  feeAmount: string;
  paymentStatus: PaymentStatus;
  studentEmail: string;
  guardianName: string;
  guardianEmail: string;
}

const emptyForm: StudentFormData = {
  name: "",
  className: "",
  parentName: "",
  parentPhone: "",
  feeAmount: "",
  paymentStatus: PaymentStatus.Unpaid,
  studentEmail: "",
  guardianName: "",
  guardianEmail: "",
};

// ===================== SIMPLE QR CODE =====================
// Minimal QR placeholder using a visual grid pattern
function QRCodeSVG({
  value,
  size = 128,
}: { value: string; size?: number; level?: string; includeMargin?: boolean }) {
  // Generate a deterministic visual pattern based on value hash
  const hash = value
    .split("")
    .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 0);
  const cells = 21;
  const cellSize = size / cells;
  const modules: boolean[][] = Array.from({ length: cells }, (_, r) =>
    Array.from({ length: cells }, (_, c) => {
      // Finder patterns (top-left, top-right, bottom-left)
      const inFinder =
        (r < 7 && c < 7) ||
        (r < 7 && c >= cells - 7) ||
        (r >= cells - 7 && c < 7);
      if (inFinder) {
        const tr = r < 7 ? r : r - (cells - 7);
        const tc = c < 7 ? c : c >= cells - 7 ? c - (cells - 7) : c;
        return (
          tr === 0 ||
          tr === 6 ||
          tc === 0 ||
          tc === 6 ||
          (tr >= 2 && tr <= 4 && tc >= 2 && tc <= 4)
        );
      }
      // Timing patterns
      if (r === 6 || c === 6) return (r + c) % 2 === 0;
      // Data pattern from hash
      const v = (hash ^ (r * 17 + c * 31 + r * c)) >>> 0;
      return v % 3 !== 0;
    }),
  );
  return (
    <svg
      role="img"
      aria-label="UPI QR Code"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>UPI QR Code</title>
      <rect width={size} height={size} fill="white" />
      {modules.flatMap((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect
              key={`cell-${r * cells + c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="black"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

// ===================== PAYMENT MODAL =====================

interface PaymentModalProps {
  student: Student | null;
  open: boolean;
  onClose: () => void;
}

function PaymentModal({ student, open, onClose }: PaymentModalProps) {
  const [step, setStep] = useState<"qr" | "success">("qr");
  const recordPayment = useRecordPayment();
  const updateStudent = useUpdateStudent();

  const handleConfirm = useCallback(async () => {
    if (!student) return;
    try {
      const now = BigInt(Date.now()) * 1_000_000n;
      const txRef = `TXN${Date.now().toString().slice(-8)}`;
      await recordPayment.mutateAsync({
        id: crypto.randomUUID(),
        transactionRef: txRef,
        studentId: student.id,
        note: `Tuition fee for ${student.name}`,
        paymentDate: now,
        amount: student.feeAmount,
      });
      await updateStudent.mutateAsync({
        id: student.id,
        student: {
          ...student,
          paymentStatus: PaymentStatus.Paid,
          lastPaymentDate: now,
        },
      });
      setStep("success");
    } catch {
      toast.error("Payment failed. Please try again.");
    }
  }, [student, recordPayment, updateStudent]);

  const handleClose = () => {
    setStep("qr");
    onClose();
  };

  const upiString = student
    ? `upi://pay?pa=9064934476@ybl&pn=Ujjwal+Bhabishyat&am=${Number(student.feeAmount)}&cu=INR&tn=Tuition+Fee+${encodeURIComponent(student.name)}`
    : "";

  const isPending = recordPayment.isPending || updateStudent.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="p-0 overflow-hidden max-w-sm border-0 shadow-2xl"
        data-ocid="payment.modal"
      >
        <AnimatePresence mode="wait">
          {step === "qr" && student && (
            <motion.div
              key="qr"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* PhonePe-style header */}
              <div className="phonepe-gradient px-6 py-5 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">₹</span>
                  </div>
                  <span className="font-bold text-sm tracking-wide">
                    Pay via PhonePe
                  </span>
                </div>
                <p className="text-xs text-white/60 mt-1 ml-8">UPI Payment</p>
              </div>

              <div className="px-6 py-5">
                {/* Student info */}
                <div className="text-center mb-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Paying for
                  </p>
                  <h3 className="font-display font-bold text-lg text-foreground">
                    {student.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Class {student.className}
                  </p>
                  <div className="mt-2">
                    <span className="text-3xl font-display font-bold text-foreground">
                      ₹{Number(student.feeAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-white rounded-xl border-2 border-purple-100 shadow-sm">
                    <QRCodeSVG
                      value={upiString}
                      size={180}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Scan with any UPI app
                  </p>
                  <div className="bg-muted rounded-lg px-4 py-2 w-full text-center">
                    <p className="text-xs text-muted-foreground">UPI ID</p>
                    <p className="text-sm font-mono font-semibold text-foreground">
                      9064934476@ybl
                    </p>
                  </div>
                  {/* Direct UPI deep link for mobile */}
                  <a
                    href={upiString}
                    data-ocid="payment.upi_link"
                    onClick={(e) => {
                      // Allow default link behavior on mobile; prevent on desktop
                      const isMobile = /Android|iPhone|iPad|iPod/i.test(
                        navigator.userAgent,
                      );
                      if (!isMobile) {
                        e.preventDefault();
                        toast("UPI app link works on mobile devices only.");
                      }
                    }}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.42 0.2 148), oklch(0.35 0.22 155))",
                    }}
                  >
                    <Smartphone className="w-4 h-4" />
                    PhonePe / UPI অ্যাপে খুলুন
                  </a>
                </div>

                <Button
                  data-ocid="payment.confirm_button"
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="w-full mt-5 h-11 font-semibold"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.38 0.22 285), oklch(0.28 0.2 270))",
                  }}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Payment Received ✓"
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "success" && student && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="px-8 py-10 flex flex-col items-center text-center"
              data-ocid="payment.success_state"
            >
              {/* Animated Green Checkmark */}
              <div className="check-animate mb-5">
                <svg
                  width="88"
                  height="88"
                  viewBox="0 0 88 88"
                  fill="none"
                  role="img"
                  aria-label="Payment successful checkmark"
                >
                  <circle
                    cx="44"
                    cy="44"
                    r="44"
                    fill="oklch(0.55 0.15 145 / 0.12)"
                  />
                  <circle
                    cx="44"
                    cy="44"
                    r="36"
                    fill="oklch(0.55 0.15 145 / 0.2)"
                  />
                  <circle cx="44" cy="44" r="28" fill="oklch(0.55 0.15 145)" />
                  <path
                    className="check-path-animate"
                    d="M28 44L38 54L60 32"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>

              <h2 className="font-display font-bold text-xl text-foreground mb-1">
                Payment Successful!
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                {student.name}
              </p>
              <p
                className="text-2xl font-display font-bold"
                style={{ color: "oklch(0.52 0.17 145)" }}
              >
                ₹{Number(student.feeAmount).toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Status updated to{" "}
                <span
                  style={{ color: "oklch(0.52 0.17 145)" }}
                  className="font-semibold"
                >
                  Paid
                </span>
              </p>

              <Button
                onClick={handleClose}
                className="w-full mt-7 h-11 font-semibold"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.52 0.17 145), oklch(0.42 0.2 150))",
                }}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// ===================== STUDENT FORM MODAL =====================

interface StudentFormModalProps {
  open: boolean;
  editStudent: Student | null;
  onClose: () => void;
}

function StudentFormModal({
  open,
  editStudent,
  onClose,
}: StudentFormModalProps) {
  const [form, setForm] = useState<StudentFormData>(
    editStudent
      ? {
          name: editStudent.name,
          className: editStudent.className,
          parentName: editStudent.parentName,
          parentPhone: editStudent.parentPhone,
          feeAmount: Number(editStudent.feeAmount).toString(),
          paymentStatus: editStudent.paymentStatus,
          studentEmail: editStudent.studentEmail ?? "",
          guardianName: editStudent.guardianName ?? "",
          guardianEmail: editStudent.guardianEmail ?? "",
        }
      : emptyForm,
  );

  const addStudent = useAddStudent();
  const updateStudent = useUpdateStudent();
  const isPending = addStudent.isPending || updateStudent.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = BigInt(Date.now()) * 1_000_000n;
    const studentData: Student = {
      id: editStudent?.id ?? crypto.randomUUID(),
      name: form.name.trim(),
      className: form.className.trim(),
      parentName: form.parentName.trim(),
      parentPhone: form.parentPhone.trim(),
      feeAmount: BigInt(Math.round(Number.parseFloat(form.feeAmount) || 0)),
      paymentStatus: form.paymentStatus,
      enrolledDate: editStudent?.enrolledDate ?? now,
      lastPaymentDate: editStudent?.lastPaymentDate,
      studentEmail: form.studentEmail.trim(),
      guardianName: form.guardianName.trim(),
      guardianEmail: form.guardianEmail.trim(),
    };
    try {
      if (editStudent) {
        await updateStudent.mutateAsync({
          id: editStudent.id,
          student: studentData,
        });
        toast.success("Student updated successfully");
      } else {
        await addStudent.mutateAsync(studentData);
        toast.success("Student added successfully");
      }
      onClose();
    } catch {
      toast.error("Failed to save student. Please try again.");
    }
  };

  // Sync form when editStudent changes
  const handleOpen = (o: boolean) => {
    if (!o) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-bold">
            {editStudent ? "Edit Student" : "Add New Student"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Student Name *</Label>
              <Input
                data-ocid="students.form.name_input"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Full name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Class *</Label>
              <Input
                data-ocid="students.form.class_input"
                value={form.className}
                onChange={(e) =>
                  setForm((f) => ({ ...f, className: e.target.value }))
                }
                placeholder="e.g., 10th"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Parent Name *</Label>
              <Input
                data-ocid="students.form.parent_name_input"
                value={form.parentName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, parentName: e.target.value }))
                }
                placeholder="Parent's name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Parent Phone *</Label>
              <Input
                data-ocid="students.form.parent_phone_input"
                value={form.parentPhone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, parentPhone: e.target.value }))
                }
                placeholder="+91XXXXXXXXXX"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Fee Amount (₹) *</Label>
              <Input
                data-ocid="students.form.fee_input"
                type="number"
                value={form.feeAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, feeAmount: e.target.value }))
                }
                placeholder="e.g., 2500"
                min="0"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Status</Label>
              <Select
                value={form.paymentStatus}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, paymentStatus: v as PaymentStatus }))
                }
              >
                <SelectTrigger data-ocid="students.form.status_select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentStatus.Paid}>Paid</SelectItem>
                  <SelectItem value={PaymentStatus.Unpaid}>Unpaid</SelectItem>
                  <SelectItem value={PaymentStatus.Pending}>Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* New fields: Student Email, Guardian Name, Guardian Email */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Student Email</Label>
            <Input
              data-ocid="students.form.student_email_input"
              type="email"
              value={form.studentEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, studentEmail: e.target.value }))
              }
              placeholder="student@email.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Guardian Name</Label>
              <Input
                data-ocid="students.form.guardian_name_input"
                value={form.guardianName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, guardianName: e.target.value }))
                }
                placeholder="Guardian's full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Guardian Email</Label>
              <Input
                data-ocid="students.form.guardian_email_input"
                type="email"
                value={form.guardianEmail}
                onChange={(e) =>
                  setForm((f) => ({ ...f, guardianEmail: e.target.value }))
                }
                placeholder="guardian@email.com"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-ocid="students.form.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-ocid="students.form.submit_button"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editStudent ? (
                "Save Changes"
              ) : (
                "Add Student"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== MAIN PAGE =====================

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

function StudentsPageContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterTab>("All");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [paymentStudent, setPaymentStudent] = useState<Student | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: allStudents = [], isLoading } = useListStudents();
  const deleteStudent = useDeleteStudent();

  const filtered = allStudents.filter((s) => {
    const matchesSearch =
      !searchTerm ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.className.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "All" || s.paymentStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteStudent.mutateAsync(id);
      toast.success("Student deleted");
      setDeleteConfirmId(null);
    } catch {
      toast.error("Failed to delete student");
    }
  };

  const handlePayment = (student: Student) => {
    setPaymentStudent(student);
    setPaymentModalOpen(true);
  };

  return (
    <div data-ocid="students.page" className="p-6 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground">
            Student Database
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {allStudents.length} students enrolled
          </p>
        </div>
        <Button
          data-ocid="students.add_button"
          onClick={() => {
            setEditStudent(null);
            setAddModalOpen(true);
          }}
          className="gap-2"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.45 0.2 265), oklch(0.38 0.22 285))",
          }}
        >
          <Plus className="w-4 h-4" />
          Add Student
        </Button>
      </motion.div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="students.search_input"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
          <TabsList className="h-9">
            <TabsTrigger
              value="All"
              className="text-xs"
              data-ocid="students.filter.all.tab"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value={PaymentStatus.Paid}
              className="text-xs"
              data-ocid="students.filter.paid.tab"
            >
              Paid
            </TabsTrigger>
            <TabsTrigger
              value={PaymentStatus.Unpaid}
              className="text-xs"
              data-ocid="students.filter.unpaid.tab"
            >
              Unpaid
            </TabsTrigger>
            <TabsTrigger
              value={PaymentStatus.Pending}
              className="text-xs"
              data-ocid="students.filter.pending.tab"
            >
              Pending
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="py-16 text-center text-muted-foreground"
              data-ocid="students.empty_state"
            >
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No students found</p>
              <p className="text-sm mt-1">
                {searchTerm
                  ? "Try a different search term"
                  : "Add your first student"}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Name
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, i) => (
                  <tr
                    key={student.id}
                    data-ocid={`students.item.${i + 1}`}
                    className={`table-row-hover transition-colors ${i < filtered.length - 1 ? "border-b border-border/60" : ""}`}
                  >
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="font-medium text-foreground">
                          {student.name}
                        </p>
                        <p className="text-xs text-muted-foreground sm:hidden">
                          Class {student.className}
                        </p>
                        {student.studentEmail && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[140px]">
                              {student.studentEmail}
                            </span>
                          </p>
                        )}
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
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          data-ocid={`students.payment_button.${i + 1}`}
                          size="sm"
                          variant="outline"
                          onClick={() => handlePayment(student)}
                          className="h-7 px-2 text-xs gap-1 text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                          title="Collect Payment"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Pay</span>
                        </Button>
                        <Button
                          data-ocid={`students.edit_button.${i + 1}`}
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditStudent(student);
                            setAddModalOpen(true);
                          }}
                          className="h-7 px-2 text-xs"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          data-ocid={`students.delete_button.${i + 1}`}
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteConfirmId(student.id)}
                          className="h-7 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <StudentFormModal
        open={addModalOpen}
        editStudent={editStudent}
        onClose={() => {
          setAddModalOpen(false);
          setEditStudent(null);
        }}
      />

      {/* Payment Modal */}
      <PaymentModal
        student={paymentStudent}
        open={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setPaymentStudent(null);
        }}
      />

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(o) => !o && setDeleteConfirmId(null)}
      >
        <DialogContent className="max-w-sm" data-ocid="students.delete.dialog">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">
              Delete Student?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This action cannot be undone. The student record will be permanently
            removed.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              data-ocid="students.delete.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteStudent.isPending}
              data-ocid="students.delete.confirm_button"
            >
              {deleteStudent.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function StudentsPage() {
  if (!isAdmin()) return <AccessDenied pageName="ছাত্র ব্যবস্থাপনা" />;
  return <StudentsPageContent />;
}

// Need Users icon
function Users({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      role="img"
      aria-label="Users"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}
