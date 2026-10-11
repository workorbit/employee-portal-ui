import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PayrollClaim, PayrollClaimStatus } from '../../shared/models/payroll.model';

export interface SaveDraftPayload {
  period: string;
  basicPay: number;
  bonus?: number;
  deductions?: number;
  reimbursement?: number;
  notes?: string;
}

export interface ListPayrollClaimsParams {
  status?: PayrollClaimStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedPayrollClaims {
  items: PayrollClaim[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class PayrollApiService {
  private readonly baseUrl = environment.payrollServiceUrl;

  constructor(private readonly http: HttpClient) {}

  getAll(params: ListPayrollClaimsParams = {}): Observable<PaginatedPayrollClaims> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedPayrollClaims>(`${this.baseUrl}/payroll`, { params: httpParams });
  }

  saveDraft(payload: SaveDraftPayload): Observable<PayrollClaim> {
    return this.http.post<PayrollClaim>(`${this.baseUrl}/payroll`, payload);
  }

  updateDraft(id: string, payload: SaveDraftPayload): Observable<PayrollClaim> {
    return this.http.put<PayrollClaim>(`${this.baseUrl}/payroll/${id}`, payload);
  }

  submit(id: string): Observable<PayrollClaim> {
    return this.http.post<PayrollClaim>(`${this.baseUrl}/payroll/${id}/submit`, {});
  }
}
