import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FeedbackState } from './feedback.reducer';

export const selectFeedbackState = createFeatureSelector<FeedbackState>('feedback');

export const selectFeedbackItems = createSelector(selectFeedbackState, (state) => state.items);
export const selectFeedbackLoading = createSelector(selectFeedbackState, (state) => state.loading);
export const selectFeedbackSaving = createSelector(selectFeedbackState, (state) => state.saving);
export const selectFeedbackError = createSelector(selectFeedbackState, (state) => state.error);
