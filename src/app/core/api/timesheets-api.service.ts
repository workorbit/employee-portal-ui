import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Timesheet,
  TimesheetEntry,
  TimesheetEntryStatus,
  TimesheetPeriodType,
  TimesheetStatus,
} from '../../shared/models/timesheet.model';

export interface SaveDraftPayload {
  period: string;
  periodType: TimesheetPeriodType;
  entries: TimesheetEntry[];
  comment?: string;
}

export interface ListTimesheetsParams {
  status?: TimesheetStatus;
  entryStatus?: TimesheetEntryStatus;
  periodType?: TimesheetPeriodType;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTimesheets {
  items: Timesheet[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class TimesheetsApiService {
  private readonly baseUrl = environment.timesheetsServiceUrl;

  constructor(private readonly http: HttpClient) {}

  getAll(params: ListTimesheetsParams = {}): Observable<PaginatedTimesheets> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedTimesheets>(`${this.baseUrl}/timesheets`, { params: httpParams });
  }

  saveDraft(payload: SaveDraftPayload): Observable<Timesheet> {
    return this.http.post<Timesheet>(`${this.baseUrl}/timesheets`, payload);
  }

  updateDraft(id: string, payload: SaveDraftPayload): Observable<Timesheet> {
    return this.http.put<Timesheet>(`${this.baseUrl}/timesheets/${id}`, payload);
  }

  submit(id: string): Observable<Timesheet> {
    return this.http.post<Timesheet>(`${this.baseUrl}/timesheets/${id}/submit`, {});
  }
}
