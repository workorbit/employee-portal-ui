import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TimesheetsState } from './timesheets.reducer';

export const selectTimesheetsState = createFeatureSelector<TimesheetsState>('timesheets');

export const selectTimesheets = createSelector(selectTimesheetsState, (state) => state.timesheets);
export const selectTimesheetsLoading = createSelector(selectTimesheetsState, (state) => state.loading);
export const selectTimesheetsSaving = createSelector(selectTimesheetsState, (state) => state.saving);
export const selectTimesheetsError = createSelector(selectTimesheetsState, (state) => state.error);

export const selectTimesheetsListItems = createSelector(selectTimesheetsState, (state) => state.listItems);
export const selectTimesheetsListTotal = createSelector(selectTimesheetsState, (state) => state.listTotal);
export const selectTimesheetsListLoading = createSelector(
  selectTimesheetsState,
  (state) => state.listLoading,
);
