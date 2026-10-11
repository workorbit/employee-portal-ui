import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { CreateFeedbackPayload, Feedback } from '../../shared/models/feedback.model';

export const FeedbackActions = createActionGroup({
  source: 'Feedback',
  events: {
    'Load Feedback': emptyProps(),
    'Load Feedback Success': props<{ items: Feedback[] }>(),
    'Load Feedback Failure': props<{ error: string }>(),

    'Create Feedback': props<{ payload: CreateFeedbackPayload }>(),
    'Create Feedback Success': props<{ item: Feedback }>(),
    'Create Feedback Failure': props<{ error: string }>(),
  },
});
