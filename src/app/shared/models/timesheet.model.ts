export enum TimesheetStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// Per-day status on a timesheet entry — distinct from the timesheet-level
// TimesheetStatus (draft/pending/approved/rejected) above.
export enum TimesheetEntryStatus {
  PRESENT = 'present',
  WFH = 'wfh',
  LEAVE = 'leave',
  SICK_LEAVE = 'sick_leave',
  HOLIDAY = 'holiday',
  WEEKEND = 'weekend',
}

export enum TimesheetPeriodType {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export interface TimesheetEntry {
  date: string;
  hours: number;
  task?: string;
  status: TimesheetEntryStatus;
}

export interface TimesheetStatusEvent {
  status: TimesheetStatus;
  remarks?: string;
  changedBy: string;
  changedByName?: string;
  changedAt: string;
}

export interface Timesheet {
  id: string;
  employeeId: string;
  companyId: string;
  period: string;
  periodType: TimesheetPeriodType;
  entries: TimesheetEntry[];
  comment?: string;
  totalHours: number;
  status: TimesheetStatus;
  statusHistory: TimesheetStatusEvent[];
  companyName?: string;
  createdAt: string;
}

export interface UpdateTimesheetStatusPayload {
  status: TimesheetStatus.APPROVED | TimesheetStatus.REJECTED | TimesheetStatus.PENDING;
  remarks?: string;
}
