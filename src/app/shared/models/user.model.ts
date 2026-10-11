export enum UserRole {
  EMPLOYER_ADMIN = 'employer_admin',
  EMPLOYEE = 'employee',
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  employeeId?: string | null;
  mustChangePassword: boolean;
  /** Company-wide monthly pay-cycle start day (1-28, 1 = plain calendar month). */
  payCycleStartDay: number;
}
