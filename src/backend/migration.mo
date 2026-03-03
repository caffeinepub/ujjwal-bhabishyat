import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type PaymentStatus = {
    #Paid;
    #Unpaid;
    #Pending;
  };

  type Teacher = {
    id : Text;
    name : Text;
    subject : Text;
    qualification : Text;
    contactPhone : Text;
    email : Text;
    joiningDate : Time.Time;
    isActive : Bool;
  };

  type Student = {
    id : Text;
    name : Text;
    className : Text;
    parentName : Text;
    parentPhone : Text;
    studentEmail : Text;
    guardianName : Text;
    guardianEmail : Text;
    feeAmount : Nat;
    paymentStatus : PaymentStatus;
    enrolledDate : Time.Time;
    lastPaymentDate : ?Time.Time;
  };

  type PaymentRecord = {
    id : Text;
    studentId : Text;
    amount : Nat;
    paymentDate : Time.Time;
    transactionRef : Text;
    note : Text;
  };

  type DashboardStats = {
    totalStudents : Nat;
    totalTeachers : Nat;
    totalFeesCollectedThisMonth : Nat;
    pendingCount : Nat;
    paidCount : Nat;
  };

  type UserRole = {
    #admin;
    #user;
  };

  type User = {
    userId : Text;
    name : Text;
    email : Text;
    phone : Text;
    role : UserRole;
    createdAt : Time.Time;
  };

  type UserProfile = {
    name : Text;
    email : Text;
    phone : Text;
  };

  type OldActor = {
    teachers : Map.Map<Text, Teacher>;
    students : Map.Map<Text, Student>;
    payments : Map.Map<Text, PaymentRecord>;
  };

  type NewActor = {
    teachers : Map.Map<Text, Teacher>;
    students : Map.Map<Text, Student>;
    payments : Map.Map<Text, PaymentRecord>;
    users : Map.Map<Text, User>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    {
      teachers = old.teachers;
      students = old.students;
      payments = old.payments;
      users = Map.empty<Text, User>();
      userProfiles = Map.empty<Principal, UserProfile>();
    };
  };
};
