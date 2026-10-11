import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Employee } from '../../shared/models/employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeesApiService {
  private readonly baseUrl = environment.employeesServiceUrl;

  constructor(private readonly http: HttpClient) {}

  getMyProfile(): Observable<Employee> {
    return this.http.get<Employee>(`${this.baseUrl}/employees/me`);
  }

  updateMyProfile(data: {
    name: string;
    department?: string;
    designation?: string;
  }): Observable<Employee> {
    return this.http.patch<Employee>(`${this.baseUrl}/employees/me`, data);
  }
}
