import { createReducer, on } from '@ngrx/store';
import { PayrollActions } from './payroll.actions';
import { PayrollClaim } from '../../shared/models/payroll.model';

export interface PayrollState {
  claims: PayrollClaim[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export const initialPayrollState: PayrollState = {
  claims: [],
  loading: false,
  saving: false,
  error: null,
};

export const payrollReducer = createReducer(
  initialPayrollState,

  on(PayrollActions.loadPayrollClaims, (state): PayrollState => ({ ...state, loading: true, error: null })),
  on(
    PayrollActions.loadPayrollClaimsSuccess,
    (state, { claims }): PayrollState => ({ ...state, claims, loading: false }),
  ),
  on(
    PayrollActions.loadPayrollClaimsFailure,
    (state, { error }): PayrollState => ({ ...state, loading: false, error }),
  ),

  on(PayrollActions.saveDraft, (state): PayrollState => ({ ...state, saving: true, error: null })),
  on(
    PayrollActions.saveDraftSuccess,
    (state, { claim }): PayrollState => ({
      ...state,
      claims: [claim, ...state.claims],
      saving: false,
    }),
  ),
  on(PayrollActions.saveDraftFailure, (state, { error }): PayrollState => ({ ...state, saving: false, error })),

  on(PayrollActions.updateDraft, (state): PayrollState => ({ ...state, saving: true, error: null })),
  on(
    PayrollActions.updateDraftSuccess,
    (state, { claim }): PayrollState => ({
      ...state,
      claims: state.claims.map((item) => (item.id === claim.id ? claim : item)),
      saving: false,
    }),
  ),
  on(
    PayrollActions.updateDraftFailure,
    (state, { error }): PayrollState => ({ ...state, saving: false, error }),
  ),

  on(
    PayrollActions.submitPayrollClaimSuccess,
    (state, { claim }): PayrollState => ({
      ...state,
      claims: state.claims.map((item) => (item.id === claim.id ? claim : item)),
    }),
  ),
);
