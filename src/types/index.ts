export type Role = 'SUPER_ADMIN' | 'MENTOR' | 'EMPLOYEE' | 'VOLUNTEER' | 'CAMPUS_AMBASSADOR';

export interface User {
  id: string; // auth.uid
  forenclueId: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
  designation?: string;
  phone?: string;
  teamIds?: string[];
  mentorId?: string;
  joiningDate: string;
  profilePhoto?: string;
  bio?: string;
  skills?: string[];
  tempPasswordChanged: boolean;
  active: boolean;
  createdAt: number;
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'NOT STARTED' | 'IN PROGRESS' | 'SUBMITTED' | 'UNDER REVIEW' | 'REVISION REQUESTED' | 'APPROVED' | 'OVERDUE';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // userId
  assignedTeam?: string; // teamId
  createdBy: string; // userId
  priority: TaskPriority;
  deadline: number; // timestamp
  status: TaskStatus;
  progress?: number;
  attachments?: string[]; // urls
  createdAt: number;
  updatedAt: number;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  mentorIds: string[];
  memberIds: string[];
  createdAt: number;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  authorId: string;
  targetAudience: 'EVERYONE' | Role | string; // teamId or role
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  attachments?: string[];
  createdAt: number;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: string;
  size: number;
  category: string;
  uploadedBy: string;
  createdAt: number;
}

export interface WorkspaceEvent {
  id: string | number;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: string;
  category: 'Meeting' | 'Briefing' | 'Webinar' | 'Orientation' | 'Case Review' | 'Workshop' | string;
  description?: string;
  createdAt?: number;
}

export interface DepartmentConfig {
  name: string;
  code: string;
  mentorName: string;
  mentorId: string;
  mentorEmail: string;
  desc?: string;
  color?: string;
  badgeColor?: string;
}

export interface SystemSettings {
  id: string;
  workspaceName: string;
  workspaceTagline: string;
  defaultPassword: string;
  enforceFirstTimePasswordReset: boolean;
  autoJoinDepartmentChat: boolean;
  enforceTaskRoleAllotment: boolean;
  requireDeliverableApproval: boolean;
  systemBannerMessage: string;
  systemBannerActive: boolean;
  sessionTimeoutMinutes: number;
  maintenanceMode: boolean;
  departments: DepartmentConfig[];
  updatedAt?: string;
  updatedBy?: string;
  updatedByEmail?: string;
}


