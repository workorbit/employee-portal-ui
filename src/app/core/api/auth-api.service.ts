import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, UserRole } from '../../shared/models/user.model';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
}

/** Identifies this app to the auth service. It scopes the refresh cookie per
 * portal (both portals live on `localhost`, and cookies ignore ports — one
 * shared cookie name meant signing into one portal wiped the other's session)
 * and rejects accounts whose role this portal doesn't serve. */
const PORTAL = 'employee';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly baseUrl = environment.authServiceUrl;

  private readonly portalHeaders = new HttpHeaders({ 'X-Portal': PORTAL });

  constructor(private readonly http: HttpClient) {}

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, payload, {
      withCredentials: true,
      headers: this.portalHeaders,
    });
  }

  changePassword(newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/auth/password`, { newPassword });
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/auth/password/forgot`, { email });
  }

  resetPassword(payload: { email: string; otp: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/auth/password/reset`, payload);
  }

  refresh(): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(
      `${this.baseUrl}/auth/refresh`,
      {},
      { withCredentials: true, headers: this.portalHeaders },
    );
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/auth/logout`,
      {},
      { withCredentials: true, headers: this.portalHeaders },
    );
  }

  /** Takes the access token explicitly — during session restore it's called
   * with a freshly-issued token that hasn't been written to the store yet,
   * so the interceptor (which reads from the store) would attach nothing.
   * Returns the raw JWT payload — it has no `name`/`mustChangePassword`, so
   * the caller fills those in with sensible defaults. */
  me(accessToken: string): Observable<{
    sub: string;
    email: string;
    role: UserRole;
    companyId: string;
    employeeId?: string;
    payCycleStartDay: number;
  }> {
    return this.http.get<{
      sub: string;
      email: string;
      role: UserRole;
      companyId: string;
      employeeId?: string;
      payCycleStartDay: number;
    }>(`${this.baseUrl}/auth/me`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${accessToken}` }),
    });
  }
}
