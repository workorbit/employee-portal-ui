export interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  joiningDate: string;
  salary: number;
  payType: 'hourly' | 'fixed';
  isActive: boolean;
  createdAt: string;
}
