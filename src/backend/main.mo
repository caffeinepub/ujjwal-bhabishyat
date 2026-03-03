import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import List "mo:core/List";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type PaymentStatus = {
    #Paid;
    #Unpaid;
    #Pending;
  };

  public type Teacher = {
    id : Text;
    name : Text;
    subject : Text;
    qualification : Text;
    contactPhone : Text;
    email : Text;
    joiningDate : Time.Time;
    isActive : Bool;
  };

  public type Student = {
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

  public type PaymentRecord = {
    id : Text;
    studentId : Text;
    amount : Nat;
    paymentDate : Time.Time;
    transactionRef : Text;
    note : Text;
  };

  public type DashboardStats = {
    totalStudents : Nat;
    totalTeachers : Nat;
    totalFeesCollectedThisMonth : Nat;
    pendingCount : Nat;
    paidCount : Nat;
  };

  public type UserRole = {
    #admin;
    #user;
  };

  public type User = {
    userId : Text;
    name : Text;
    email : Text;
    phone : Text;
    role : UserRole;
    createdAt : Time.Time;
  };

  public type UserProfile = {
    name : Text;
    email : Text;
    phone : Text;
  };

  module Teacher {
    public func compare(t1 : Teacher, t2 : Teacher) : Order.Order {
      Text.compare(t1.id, t2.id);
    };
  };

  module Student {
    public func compare(s1 : Student, s2 : Student) : Order.Order {
      Text.compare(s1.id, s2.id);
    };
  };

  module PaymentRecord {
    public func compare(p1 : PaymentRecord, p2 : PaymentRecord) : Order.Order {
      Text.compare(p1.id, p2.id);
    };
  };

  module User {
    public func compare(u1 : User, u2 : User) : Order.Order {
      Text.compare(u1.userId, u2.userId);
    };
  };

  let teachers = Map.empty<Text, Teacher>();
  let students = Map.empty<Text, Student>();
  let payments = Map.empty<Text, PaymentRecord>();
  let users = Map.empty<Text, User>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Management (required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // User Management
  public shared ({ caller }) func registerUser(name : Text, email : Text, phone : Text) : async Text {
    // No authorization check - registration is open to guests
    // Check if user already exists with email or phone
    let existingUser = users.values().toArray().find(
      func(user) {
        user.email == email or user.phone == phone;
      }
    );

    switch (existingUser) {
      case (null) {
        let userId = nextUserId();
        let newUser : User = {
          userId;
          name;
          email;
          phone;
          role = #user;
          createdAt = Time.now();
        };
        users.add(userId, newUser);
        userId;
      };
      case (?_) { Runtime.trap("User already exists with this email or phone") };
    };
  };

  public shared ({ caller }) func loginUser(nameOrEmail : Text, phone : Text) : async ?User {
    // No authorization check - login is open to guests
    let foundUser = users.values().toArray().find(
      func(user) {
        (user.email == nameOrEmail or user.name == nameOrEmail) and user.phone == phone
      }
    );

    switch (foundUser) {
      case (null) { null };
      case (?user) { ?user };
    };
  };

  public query ({ caller }) func getUser(userId : Text) : async ?User {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view user details");
    };
    users.get(userId);
  };

  public query ({ caller }) func listUsers() : async [User] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    users.values().toArray().sort();
  };

  public shared ({ caller }) func setupAdmin(name : Text, _email : Text, phone : Text) : async Text {
    // No authorization check - setupAdmin is open to guests (idempotent)
    // Check if admin already exists (find will return null if not found)
    let adminExists = users.values().toArray().find(func(user) { user.role == #admin }) != null;

    if (adminExists) {
      switch (users.values().toArray().find(func(user) { user.role == #admin })) {
        case (null) { Runtime.trap("Admin user not found after check") };
        case (?adminUser) { adminUser.userId };
      };
    } else {
      let adminId = nextUserId();
      let newAdmin : User = {
        userId = adminId;
        name;
        email = name;
        phone;
        role = #admin;
        createdAt = Time.now();
      };
      users.add(adminId, newAdmin);
      adminId;
    };
  };

  // Helper function to generate unique user IDs
  func nextUserId() : Text {
    let seed = Time.now() % 100000;
    let natSeed = seed.toNat() % 100000;
    "UB-" # natSeed.toText();
  };

  //--------------------------------------------
  // Teacher/Student/Payment Management (Unchanged)
  //--------------------------------------------

  public shared ({ caller }) func addTeacher(teacher : Teacher) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can add teachers");
    };
    teachers.add(teacher.id, teacher);
  };

  public shared ({ caller }) func updateTeacher(id : Text, updatedTeacher : Teacher) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can update teachers");
    };
    if (not teachers.containsKey(id)) {
      Runtime.trap("Teacher does not exist");
    };
    teachers.add(id, updatedTeacher);
  };

  public shared ({ caller }) func deleteTeacher(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can delete teachers");
    };
    if (not teachers.containsKey(id)) {
      Runtime.trap("Teacher does not exist");
    };
    teachers.remove(id);
  };

  public query ({ caller }) func listTeachers() : async [Teacher] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can list teachers");
    };
    teachers.values().toArray().sort();
  };

  public query ({ caller }) func getTeacher(id : Text) : async Teacher {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can view teacher details");
    };
    switch (teachers.get(id)) {
      case (null) { Runtime.trap("Teacher not found") };
      case (?teacher) { teacher };
    };
  };

  public shared ({ caller }) func addStudent(student : Student) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can add students");
    };
    students.add(student.id, student);
  };

  public shared ({ caller }) func updateStudent(id : Text, updatedStudent : Student) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can update students");
    };
    if (not students.containsKey(id)) {
      Runtime.trap("Student does not exist");
    };
    students.add(id, updatedStudent);
  };

  public shared ({ caller }) func deleteStudent(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can delete students");
    };
    if (not students.containsKey(id)) {
      Runtime.trap("Student does not exist");
    };
    students.remove(id);
  };

  public query ({ caller }) func listStudents() : async [Student] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can list students");
    };
    students.values().toArray().sort();
  };

  public query ({ caller }) func getStudent(id : Text) : async Student {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can view student details");
    };
    switch (students.get(id)) {
      case (null) { Runtime.trap("Student not found") };
      case (?student) { student };
    };
  };

  public query ({ caller }) func listStudentsByStatus(status : PaymentStatus) : async [Student] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can list students by status");
    };
    students.values().toArray().sort().filter(
      func(student) {
        student.paymentStatus == status;
      }
    );
  };

  public query ({ caller }) func searchStudents(searchTerm : Text) : async [Student] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can search students");
    };
    students.values().toArray().sort().filter(
      func(student) {
        student.name.toLower().contains(#text(searchTerm.toLower()));
      }
    );
  };

  public shared ({ caller }) func recordPayment(payment : PaymentRecord) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can record payments");
    };
    payments.add(payment.id, payment);

    switch (students.get(payment.studentId)) {
      case (null) { Runtime.trap("Student not found") };
      case (?student) {
        let updatedStudent = {
          id = student.id;
          name = student.name;
          className = student.className;
          parentName = student.parentName;
          parentPhone = student.parentPhone;
          studentEmail = student.studentEmail;
          guardianName = student.guardianName;
          guardianEmail = student.guardianEmail;
          feeAmount = student.feeAmount;
          paymentStatus = #Paid;
          enrolledDate = student.enrolledDate;
          lastPaymentDate = ?payment.paymentDate;
        };
        students.add(payment.studentId, updatedStudent);
      };
    };
  };

  public query ({ caller }) func listPayments() : async [PaymentRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can list payments");
    };
    payments.values().toArray().sort();
  };

  public query ({ caller }) func getStudentPayments(studentId : Text) : async [PaymentRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can view student payments");
    };
    payments.values().toArray().sort().filter(
      func(payment) {
        payment.studentId == studentId;
      }
    );
  };

  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can view dashboard stats");
    };
    let allStudents = students.values().toArray();
    let allTeachers = teachers.values().toArray();
    let allPayments = payments.values().toArray();

    let totalStudents = allStudents.size();
    let totalTeachers = allTeachers.size();

    var totalFeesCollectedThisMonth = 0;
    var pendingCount = 0;
    var paidCount = 0;

    let currentMonth = Time.now() / (30 * 24 * 60 * 60 * 1000000000);

    allStudents.forEach(
      func(student) {
        switch (student.paymentStatus) {
          case (#Paid) { paidCount += 1 };
          case (#Pending) { pendingCount += 1 };
          case (#Unpaid) {};
        };
      }
    );

    allPayments.forEach(
      func(payment) {
        let paymentMonth = payment.paymentDate / (30 * 24 * 60 * 60 * 1000000000);
        if (paymentMonth == currentMonth) {
          totalFeesCollectedThisMonth += payment.amount;
        };
      }
    );

    {
      totalStudents;
      totalTeachers;
      totalFeesCollectedThisMonth;
      pendingCount;
      paidCount;
    };
  };
};
