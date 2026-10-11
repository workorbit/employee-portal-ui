import { createReducer, on } from '@ngrx/store';
import { TimesheetsActions } from './timesheets.actions';
import { Timesheet } from '../../shared/models/timesheet.model';

export interface TimesheetsState {
  timesheets: Timesheet[];
  loading: boolean;
  saving: boolean;
  error: string | null;

  listItems: Timesheet[];
  listTotal: number;
  listLoading: boolean;
}

export const initialTimesheetsState: TimesheetsState = {
  timesheets: [],
  loading: false,
  saving: false,
  error: null,

  listItems: [],
  listTotal: 0,
  listLoading: false,
};

export const timesheetsReducer = createReducer(
  initialTimesheetsState,

  on(TimesheetsActions.loadTimesheets, (state): TimesheetsState => ({ ...state, loading: true, error: null })),
  on(
    TimesheetsActions.loadTimesheetsSuccess,
    (state, { timesheets }): TimesheetsState => ({ ...state, timesheets, loading: false }),
  ),
  on(
    TimesheetsActions.loadTimesheetsFailure,
    (state, { error }): TimesheetsState => ({ ...state, loading: false, error }),
  ),

  on(
    TimesheetsActions.loadTimesheetsPage,
    (state): TimesheetsState => ({ ...state, listLoading: true, error: null }),
  ),
  on(
    TimesheetsActions.loadTimesheetsPageSuccess,
    (state, { items, total }): TimesheetsState => ({
      ...state,
      listItems: items,
      listTotal: total,
      listLoading: false,
    }),
  ),
  on(
    TimesheetsActions.loadTimesheetsPageFailure,
    (state, { error }): TimesheetsState => ({ ...state, listLoading: false, error }),
  ),

  on(TimesheetsActions.saveDraft, (state): TimesheetsState => ({ ...state, saving: true, error: null })),
  on(
    TimesheetsActions.saveDraftSuccess,
    (state, { timesheet }): TimesheetsState => ({
      ...state,
      timesheets: [timesheet, ...state.timesheets],
      saving: false,
    }),
  ),
  on(
    TimesheetsActions.saveDraftFailure,
    (state, { error }): TimesheetsState => ({ ...state, saving: false, error }),
  ),

  on(TimesheetsActions.updateDraft, (state): TimesheetsState => ({ ...state, saving: true, error: null })),
  on(
    TimesheetsActions.updateDraftSuccess,
    (state, { timesheet }): TimesheetsState => ({
      ...state,
      timesheets: state.timesheets.map((item) => (item.id === timesheet.id ? timesheet : item)),
      saving: false,
    }),
  ),
  on(
    TimesheetsActions.updateDraftFailure,
    (state, { error }): TimesheetsState => ({ ...state, saving: false, error }),
  ),

  on(
    TimesheetsActions.submitTimesheetSuccess,
    (state, { timesheet }): TimesheetsState => ({
      ...state,
      timesheets: state.timesheets.map((item) => (item.id === timesheet.id ? timesheet : item)),
    }),
  ),
);
