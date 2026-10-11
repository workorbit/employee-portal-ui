export enum FeedbackStatus {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
}

export enum FeedbackCategory {
  PAYROLL = 'payroll',
  TIMESHEET = 'timesheet',
  PORTAL_BUG = 'portal_bug',
  GENERAL = 'general',
}

export interface FeedbackReply {
  message: string;
  byUserId: string;
  at: string;
}

export interface Feedback {
  id: string;
  employeeId: string;
  companyId: string;
  category: FeedbackCategory;
  description: string;
  status: FeedbackStatus;
  replies: FeedbackReply[];
  createdAt: string;
}

export interface CreateFeedbackPayload {
  category: FeedbackCategory;
  description: string;
}
