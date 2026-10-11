import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of, switchMap } from 'rxjs';
import { TimesheetsApiService } from '../../core/api/timesheets-api.service';
import { TimesheetsActions } from './timesheets.actions';

@Injectable()
export class TimesheetsEffects {
  private readonly actions$ = inject(Actions);
  private readonly timesheetsApi = inject(TimesheetsApiService);

  loadTimesheets$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TimesheetsActions.loadTimesheets),
      switchMap(() =>
        this.timesheetsApi.getAll().pipe(
          map(({ items }) => TimesheetsActions.loadTimesheetsSuccess({ timesheets: items })),
          catchError((err: HttpErrorResponse) =>
            of(
              TimesheetsActions.loadTimesheetsFailure({
                error: err.error?.message ?? 'Failed to load timesheets.',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  loadTimesheetsPage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TimesheetsActions.loadTimesheetsPage),
      switchMap(({ filters, page, limit }) =>
        this.timesheetsApi.getAll({ ...filters, page, limit }).pipe(
          map(({ items, total }) => TimesheetsActions.loadTimesheetsPageSuccess({ items, total })),
          catchError((err: HttpErrorResponse) =>
            of(
              TimesheetsActions.loadTimesheetsPageFailure({
                error: err.error?.message ?? 'Failed to load timesheets.',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  saveDraft$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TimesheetsActions.saveDraft),
      switchMap(({ period, periodType, entries, comment }) =>
        this.timesheetsApi.saveDraft({ period, periodType, entries, comment }).pipe(
          map((timesheet) => TimesheetsActions.saveDraftSuccess({ timesheet })),
          catchError((err: HttpErrorResponse) =>
            of(TimesheetsActions.saveDraftFailure({ error: err.error?.message ?? 'Failed to save draft.' })),
          ),
        ),
      ),
    ),
  );

  updateDraft$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TimesheetsActions.updateDraft),
      switchMap(({ id, period, periodType, entries, comment }) =>
        this.timesheetsApi.updateDraft(id, { period, periodType, entries, comment }).pipe(
          map((timesheet) => TimesheetsActions.updateDraftSuccess({ timesheet })),
          catchError((err: HttpErrorResponse) =>
            of(
              TimesheetsActions.updateDraftFailure({
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
      ofType(TimesheetsActions.submitTimesheet),
      switchMap(({ id }) =>
        this.timesheetsApi.submit(id).pipe(
          map((timesheet) => TimesheetsActions.submitTimesheetSuccess({ timesheet })),
          catchError((err: HttpErrorResponse) =>
            of(
              TimesheetsActions.submitTimesheetFailure({
                error: err.error?.message ?? 'Failed to submit timesheet.',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
