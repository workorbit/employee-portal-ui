export enum PayrollClaimStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
}

export interface PayrollClaimStatusEvent {
  status: PayrollClaimStatus;
  remarks?: string;
  changedBy: string;
  changedByName?: string;
  changedAt: string;
}

export interface PayrollClaim {
  id: string;
  employeeId: string;
  companyId: string;
  period: string;
  basicPay: number;
  bonus: number;
  deductions: number;
  reimbursement: number;
  netPay: number;
  notes?: string;
  status: PayrollClaimStatus;
  statusHistory: PayrollClaimStatusEvent[];
  companyName?: string;
  createdAt: string;
}

export interface UpdatePayrollClaimStatusPayload {
  status: PayrollClaimStatus.APPROVED | PayrollClaimStatus.REJECTED | PayrollClaimStatus.PENDING;
  remarks?: string;
}
