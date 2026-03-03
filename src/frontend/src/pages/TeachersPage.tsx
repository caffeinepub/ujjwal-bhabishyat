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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  BookOpen,
  Edit,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Teacher } from "../backend.d";
import {
  useAddTeacher,
  useDeleteTeacher,
  useListTeachers,
  useUpdateTeacher,
} from "../hooks/useQueries";
import { isAdmin } from "../utils/auth";

interface TeacherFormData {
  name: string;
  subject: string;
  qualification: string;
  contactPhone: string;
  email: string;
  isActive: boolean;
}

const emptyForm: TeacherFormData = {
  name: "",
  subject: "",
  qualification: "",
  contactPhone: "",
  email: "",
  isActive: true,
};

function TeacherFormModal({
  open,
  editTeacher,
  onClose,
}: {
  open: boolean;
  editTeacher: Teacher | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState<TeacherFormData>(
    editTeacher
      ? {
          name: editTeacher.name,
          subject: editTeacher.subject,
          qualification: editTeacher.qualification,
          contactPhone: editTeacher.contactPhone,
          email: editTeacher.email,
          isActive: editTeacher.isActive,
        }
      : emptyForm,
  );

  const addTeacher = useAddTeacher();
  const updateTeacher = useUpdateTeacher();
  const isPending = addTeacher.isPending || updateTeacher.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = BigInt(Date.now()) * 1_000_000n;
    const teacherData: Teacher = {
      id: editTeacher?.id ?? crypto.randomUUID(),
      name: form.name.trim(),
      subject: form.subject.trim(),
      qualification: form.qualification.trim(),
      contactPhone: form.contactPhone.trim(),
      email: form.email.trim(),
      isActive: form.isActive,
      joiningDate: editTeacher?.joiningDate ?? now,
    };
    try {
      if (editTeacher) {
        await updateTeacher.mutateAsync({
          id: editTeacher.id,
          teacher: teacherData,
        });
        toast.success("Teacher updated successfully");
      } else {
        await addTeacher.mutateAsync(teacherData);
        toast.success("Teacher added successfully");
      }
      onClose();
    } catch {
      toast.error("Failed to save teacher. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-bold">
            {editTeacher ? "Edit Teacher" : "Add New Teacher"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Full Name *</Label>
              <Input
                data-ocid="teachers.form.name_input"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Teacher's name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Subject *</Label>
              <Input
                data-ocid="teachers.form.subject_input"
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subject: e.target.value }))
                }
                placeholder="e.g., Mathematics"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Qualification *</Label>
            <Input
              data-ocid="teachers.form.qualification_input"
              value={form.qualification}
              onChange={(e) =>
                setForm((f) => ({ ...f, qualification: e.target.value }))
              }
              placeholder="e.g., M.Sc. Mathematics"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Phone *</Label>
              <Input
                data-ocid="teachers.form.phone_input"
                value={form.contactPhone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactPhone: e.target.value }))
                }
                placeholder="+91XXXXXXXXXX"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email</Label>
              <Input
                data-ocid="teachers.form.email_input"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="teacher@email.com"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Switch
              data-ocid="teachers.form.active_switch"
              checked={form.isActive}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
            />
            <Label className="text-sm">Active Teacher</Label>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-ocid="teachers.form.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-ocid="teachers.form.submit_button"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editTeacher ? (
                "Save Changes"
              ) : (
                "Add Teacher"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const subjectColors: Record<string, string> = {
  Mathematics: "oklch(0.48 0.18 245)",
  Physics: "oklch(0.52 0.17 145)",
  Chemistry: "oklch(0.55 0.22 25)",
  Biology: "oklch(0.5 0.18 145)",
  English: "oklch(0.45 0.2 265)",
  Hindi: "oklch(0.6 0.2 45)",
  History: "oklch(0.55 0.15 60)",
  Science: "oklch(0.52 0.17 145)",
};

function getSubjectColor(subject: string): string {
  return subjectColors[subject] ?? "oklch(0.45 0.2 265)";
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

function TeachersPageContent() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: teachers = [], isLoading } = useListTeachers();
  const deleteTeacher = useDeleteTeacher();

  const handleDelete = async (id: string) => {
    try {
      await deleteTeacher.mutateAsync(id);
      toast.success("Teacher deleted");
      setDeleteConfirmId(null);
    } catch {
      toast.error("Failed to delete teacher");
    }
  };

  return (
    <div data-ocid="teachers.page" className="p-6 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground">
            Teacher Management
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {teachers.length} teachers on staff
          </p>
        </div>
        <Button
          data-ocid="teachers.add_button"
          onClick={() => {
            setEditTeacher(null);
            setAddModalOpen(true);
          }}
          className="gap-2"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.52 0.17 145), oklch(0.42 0.2 150))",
          }}
        >
          <Plus className="w-4 h-4" />
          Add Teacher
        </Button>
      </motion.div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : teachers.length === 0 ? (
        <div
          className="py-20 text-center text-muted-foreground"
          data-ocid="teachers.empty_state"
        >
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-25" />
          <p className="font-medium">No teachers yet</p>
          <p className="text-sm mt-1">Add your first teacher to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher, i) => {
            const color = getSubjectColor(teacher.subject);
            return (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
                data-ocid={`teachers.item.${i + 1}`}
                className="bg-card border border-border rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow"
              >
                {/* Colored header band */}
                <div className="h-1.5" style={{ background: color }} />

                <div className="p-5">
                  {/* Avatar + name */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0"
                        style={{ background: color }}
                      >
                        {getInitials(teacher.name)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-foreground leading-tight">
                          {teacher.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <BookOpen className="w-3 h-3" style={{ color }} />
                          <span
                            className="text-xs font-medium"
                            style={{ color }}
                          >
                            {teacher.subject}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={`text-xs ${teacher.isActive ? "badge-paid" : "badge-unpaid"}`}
                    >
                      {teacher.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{teacher.qualification}</span>
                    </div>
                    {teacher.contactPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{teacher.contactPhone}</span>
                      </div>
                    )}
                    {teacher.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{teacher.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                    <Button
                      data-ocid={`teachers.edit_button.${i + 1}`}
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 text-xs gap-1"
                      onClick={() => {
                        setEditTeacher(teacher);
                        setAddModalOpen(true);
                      }}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      data-ocid={`teachers.delete_button.${i + 1}`}
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setDeleteConfirmId(teacher.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <TeacherFormModal
        open={addModalOpen}
        editTeacher={editTeacher}
        onClose={() => {
          setAddModalOpen(false);
          setEditTeacher(null);
        }}
      />

      {/* Delete Confirm */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(o) => !o && setDeleteConfirmId(null)}
      >
        <DialogContent className="max-w-sm" data-ocid="teachers.delete.dialog">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">
              Delete Teacher?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This action cannot be undone. The teacher record will be permanently
            removed.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              data-ocid="teachers.delete.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteTeacher.isPending}
              data-ocid="teachers.delete.confirm_button"
            >
              {deleteTeacher.isPending ? (
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

export default function TeachersPage() {
  if (!isAdmin()) return <AccessDenied pageName="শিক্ষক ব্যবস্থাপনা" />;
  return <TeachersPageContent />;
}
