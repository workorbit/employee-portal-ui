import { createReducer, on } from '@ngrx/store';
import { FeedbackActions } from './feedback.actions';
import { Feedback } from '../../shared/models/feedback.model';

export interface FeedbackState {
  items: Feedback[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export const initialFeedbackState: FeedbackState = {
  items: [],
  loading: false,
  saving: false,
  error: null,
};

export const feedbackReducer = createReducer(
  initialFeedbackState,

  on(FeedbackActions.loadFeedback, (state): FeedbackState => ({ ...state, loading: true, error: null })),
  on(
    FeedbackActions.loadFeedbackSuccess,
    (state, { items }): FeedbackState => ({ ...state, items, loading: false }),
  ),
  on(
    FeedbackActions.loadFeedbackFailure,
    (state, { error }): FeedbackState => ({ ...state, loading: false, error }),
  ),

  on(FeedbackActions.createFeedback, (state): FeedbackState => ({ ...state, saving: true, error: null })),
  on(
    FeedbackActions.createFeedbackSuccess,
    (state, { item }): FeedbackState => ({ ...state, items: [item, ...state.items], saving: false }),
  ),
  on(
    FeedbackActions.createFeedbackFailure,
    (state, { error }): FeedbackState => ({ ...state, saving: false, error }),
  ),
);
