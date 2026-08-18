import { pgTable, text, serial, timestamp, boolean, varchar, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  forenclueId: varchar("forenclue_id", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("EMPLOYEE"), // SUPER_ADMIN, ADMIN, TEAM_LEADER, EMPLOYEE, VOLUNTEER
  department: varchar("department", { length: 100 }),
  joiningDate: timestamp("joining_date").defaultNow(),
  tempPasswordChanged: boolean("temp_password_changed").default(false),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatGroups = pgTable("chat_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  avatarUrl: text("avatar_url"), // URL or avatar identifier/color/image
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatGroupMembers = pgTable("chat_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: integer("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  senderId: integer("sender_id").notNull(),
  content: text("content").notNull(),
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: varchar("priority", { length: 50 }).notNull().default("MEDIUM"), // LOW, MEDIUM, HIGH, URGENT
  status: varchar("status", { length: 50 }).notNull().default("TODO"), // TODO, IN_PROGRESS, COMPLETED
  assignedTo: integer("assigned_to"), // user id of allotted workspace member
  department: varchar("department", { length: 100 }),
  dueDate: varchar("due_date", { length: 100 }),
  createdBy: integer("created_by").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Target recipient member
  senderId: integer("sender_id"), // Super admin / assigner
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("TASK_ASSIGNED"),
  link: text("link"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
