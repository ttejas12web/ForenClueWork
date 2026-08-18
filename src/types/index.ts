export type Role = 'SUPER_ADMIN' | 'MENTOR' | 'EMPLOYEE' | 'VOLUNTEER' | 'CAMPUS_AMBASSADOR';

export interface User {
  id: string; // auth.uid
  forenclueId: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
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
