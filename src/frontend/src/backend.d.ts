import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface User {
    userId: string;
    name: string;
    createdAt: Time;
    role: UserRole;
    email: string;
    phone: string;
}
export interface PaymentRecord {
    id: string;
    transactionRef: string;
    studentId: string;
    note: string;
    paymentDate: Time;
    amount: bigint;
}
export interface Teacher {
    id: string;
    subject: string;
    name: string;
    joiningDate: Time;
    isActive: boolean;
    email: string;
    qualification: string;
    contactPhone: string;
}
export interface DashboardStats {
    pendingCount: bigint;
    totalStudents: bigint;
    totalTeachers: bigint;
    paidCount: bigint;
    totalFeesCollectedThisMonth: bigint;
}
export interface UserProfile {
    name: string;
    email: string;
    phone: string;
}
export interface Student {
    id: string;
    studentEmail: string;
    feeAmount: bigint;
    paymentStatus: PaymentStatus;
    guardianEmail: string;
    enrolledDate: Time;
    name: string;
    lastPaymentDate?: Time;
    parentPhone: string;
    className: string;
    guardianName: string;
    parentName: string;
}
export enum PaymentStatus {
    Paid = "Paid",
    Unpaid = "Unpaid",
    Pending = "Pending"
}
export enum UserRole {
    admin = "admin",
    user = "user"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addStudent(student: Student): Promise<void>;
    addTeacher(teacher: Teacher): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    deleteStudent(id: string): Promise<void>;
    deleteTeacher(id: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getDashboardStats(): Promise<DashboardStats>;
    getStudent(id: string): Promise<Student>;
    getStudentPayments(studentId: string): Promise<Array<PaymentRecord>>;
    getTeacher(id: string): Promise<Teacher>;
    getUser(userId: string): Promise<User | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listPayments(): Promise<Array<PaymentRecord>>;
    listStudents(): Promise<Array<Student>>;
    listStudentsByStatus(status: PaymentStatus): Promise<Array<Student>>;
    listTeachers(): Promise<Array<Teacher>>;
    listUsers(): Promise<Array<User>>;
    loginUser(nameOrEmail: string, phone: string): Promise<User | null>;
    recordPayment(payment: PaymentRecord): Promise<void>;
    registerUser(name: string, email: string, phone: string): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchStudents(searchTerm: string): Promise<Array<Student>>;
    setupAdmin(name: string, _email: string, phone: string): Promise<string>;
    updateStudent(id: string, updatedStudent: Student): Promise<void>;
    updateTeacher(id: string, updatedTeacher: Teacher): Promise<void>;
}
