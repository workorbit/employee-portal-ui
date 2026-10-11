import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of, switchMap } from 'rxjs';
import { PayrollApiService } from '../../core/api/payroll-api.service';
import { PayrollActions } from './payroll.actions';

@Injectable()
export class PayrollEffects {
  private readonly actions$ = inject(Actions);
  private readonly payrollApi = inject(PayrollApiService);

  loadPayrollClaims$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PayrollActions.loadPayrollClaims),
      switchMap(() =>
        this.payrollApi.getAll().pipe(
          map(({ items }) => PayrollActions.loadPayrollClaimsSuccess({ claims: items })),
          catchError((err: HttpErrorResponse) =>
            of(
              PayrollActions.loadPayrollClaimsFailure({
                error: err.error?.message ?? 'Failed to load payroll claims.',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  saveDraft$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PayrollActions.saveDraft),
      switchMap(({ period, basicPay, bonus, deductions, reimbursement, notes }) =>
        this.payrollApi.saveDraft({ period, basicPay, bonus, deductions, reimbursement, notes }).pipe(
          map((claim) => PayrollActions.saveDraftSuccess({ claim })),
          catchError((err: HttpErrorResponse) =>
            of(PayrollActions.saveDraftFailure({ error: err.error?.message ?? 'Failed to save draft.' })),
          ),
        ),
      ),
    ),
  );

  updateDraft$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PayrollActions.updateDraft),
      switchMap(({ id, period, basicPay, bonus, deductions, reimbursement, notes }) =>
        this.payrollApi.updateDraft(id, { period, basicPay, bonus, deductions, reimbursement, notes }).pipe(
          map((claim) => PayrollActions.updateDraftSuccess({ claim })),
          catchError((err: HttpErrorResponse) =>
            of(
              PayrollActions.updateDraftFailure({
                error: err.error?.message ?? 'Failed to update draft.',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  submit$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PayrollActions.submitPayrollClaim),
      switchMap(({ id }) =>
        this.payrollApi.submit(id).pipe(
          map((claim) => PayrollActions.submitPayrollClaimSuccess({ claim })),
          catchError((err: HttpErrorResponse) =>
            of(
              PayrollActions.submitPayrollClaimFailure({
                error: err.error?.message ?? 'Failed to submit payroll claim.',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
