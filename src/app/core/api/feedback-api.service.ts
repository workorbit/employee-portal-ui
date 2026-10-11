import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateFeedbackPayload, Feedback } from '../../shared/models/feedback.model';

@Injectable({ providedIn: 'root' })
export class FeedbackApiService {
  private readonly baseUrl = environment.feedbackServiceUrl;

  constructor(private readonly http: HttpClient) {}

  // Employee tokens scope this to "my own submissions" server-side.
  getAll(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.baseUrl}/feedback`);
  }

  create(payload: CreateFeedbackPayload): Observable<Feedback> {
    return this.http.post<Feedback>(`${this.baseUrl}/feedback`, payload);
  }
}
