import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { PayrollClaim } from '../../shared/models/payroll.model';

export interface DraftPayload {
  period: string;
  basicPay: number;
  bonus?: number;
  deductions?: number;
  reimbursement?: number;
  notes?: string;
}

export const PayrollActions = createActionGroup({
  source: 'Payroll',
  events: {
    'Load Payroll Claims': emptyProps(),
    'Load Payroll Claims Success': props<{ claims: PayrollClaim[] }>(),
    'Load Payroll Claims Failure': props<{ error: string }>(),

    'Save Draft': props<DraftPayload>(),
    'Save Draft Success': props<{ claim: PayrollClaim }>(),
    'Save Draft Failure': props<{ error: string }>(),

    'Update Draft': props<DraftPayload & { id: string }>(),
    'Update Draft Success': props<{ claim: PayrollClaim }>(),
    'Update Draft Failure': props<{ error: string }>(),

    'Submit Payroll Claim': props<{ id: string }>(),
    'Submit Payroll Claim Success': props<{ claim: PayrollClaim }>(),
    'Submit Payroll Claim Failure': props<{ error: string }>(),
  },
});
