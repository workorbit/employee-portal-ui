import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  Timesheet,
  TimesheetEntry,
  TimesheetEntryStatus,
  TimesheetPeriodType,
  TimesheetStatus,
} from '../../shared/models/timesheet.model';

export interface DraftPayload {
  period: string;
  periodType: TimesheetPeriodType;
  entries: TimesheetEntry[];
  comment?: string;
}

export interface TimesheetsListFilters {
  status?: TimesheetStatus;
  entryStatus?: TimesheetEntryStatus;
  periodType?: TimesheetPeriodType;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export const TimesheetsActions = createActionGroup({
  source: 'Timesheets',
  events: {
    'Load Timesheets': emptyProps(),
    'Load Timesheets Success': props<{ timesheets: Timesheet[] }>(),
    'Load Timesheets Failure': props<{ error: string }>(),

    // Separate from the pair above — this drives the paginated/filtered
    // "My Timesheets" list, while Load Timesheets keeps loading the full,
    // unfiltered set the Calendar tab needs to look up a period by date.
    'Load Timesheets Page': props<{ filters: TimesheetsListFilters; page: number; limit: number }>(),
    'Load Timesheets Page Success': props<{ items: Timesheet[]; total: number }>(),
    'Load Timesheets Page Failure': props<{ error: string }>(),

    'Save Draft': props<DraftPayload>(),
    'Save Draft Success': props<{ timesheet: Timesheet }>(),
    'Save Draft Failure': props<{ error: string }>(),

    'Update Draft': props<DraftPayload & { id: string }>(),
    'Update Draft Success': props<{ timesheet: Timesheet }>(),
    'Update Draft Failure': props<{ error: string }>(),

    'Submit Timesheet': props<{ id: string }>(),
    'Submit Timesheet Success': props<{ timesheet: Timesheet }>(),
    'Submit Timesheet Failure': props<{ error: string }>(),
  },
});
