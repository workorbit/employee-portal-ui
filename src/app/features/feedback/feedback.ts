import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppShell } from '../../shared/components/app-shell/app-shell';
import { Icon } from '../../shared/components/icon/icon';
import { FeedbackActions } from '../../store/feedback/feedback.actions';
import {
  selectFeedbackItems,
  selectFeedbackLoading,
  selectFeedbackSaving,
} from '../../store/feedback/feedback.selectors';
import { Feedback as FeedbackItem, FeedbackCategory, FeedbackStatus } from '../../shared/models/feedback.model';

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  [FeedbackCategory.PAYROLL]: 'Payroll',
  [FeedbackCategory.TIMESHEET]: 'Timesheet',
  [FeedbackCategory.PORTAL_BUG]: 'Portal Bug',
  [FeedbackCategory.GENERAL]: 'General',
};

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  [FeedbackStatus.OPEN]: 'Open',
  [FeedbackStatus.IN_REVIEW]: 'In Review',
  [FeedbackStatus.RESOLVED]: 'Resolved',
};

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [FormsModule, DatePipe, AppShell, Icon],
  templateUrl: './feedback.html',
  styleUrl: './feedback.scss',
})
export class Feedback implements OnInit {
  private readonly store = inject(Store);

  protected readonly categoryOptions = Object.values(FeedbackCategory);

  protected readonly items = this.store.selectSignal(selectFeedbackItems);
  protected readonly loading = this.store.selectSignal(selectFeedbackLoading);
  protected readonly saving = this.store.selectSignal(selectFeedbackSaving);

  protected readonly sortedItems = computed(() =>
    [...this.items()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );

  protected readonly category = signal<FeedbackCategory>(FeedbackCategory.GENERAL);
  protected readonly description = signal('');

  protected readonly canSubmit = computed(() => this.description().trim().length > 0 && !this.saving());

  /** Flips true the moment Submit is clicked; the effect below clears the
   * form once `saving` comes back down to false (the create request landed),
   * the same "wait for the round trip, then reset" shape used by Timesheets
   * and Payroll's submit flows. */
  private readonly awaitingSubmit = signal(false);

  constructor() {
    effect(() => {
      if (this.awaitingSubmit() && !this.saving()) {
        this.awaitingSubmit.set(false);
        this.category.set(FeedbackCategory.GENERAL);
        this.description.set('');
      }
    });
  }

  ngOnInit(): void {
    this.store.dispatch(FeedbackActions.loadFeedback());
  }

  setCategory(value: string): void {
    this.category.set(value as FeedbackCategory);
  }

  setDescription(value: string): void {
    this.description.set(value);
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.awaitingSubmit.set(true);
    this.store.dispatch(
      FeedbackActions.createFeedback({
        payload: { category: this.category(), description: this.description().trim() },
      }),
    );
  }

  categoryLabel(category: FeedbackCategory): string {
    return CATEGORY_LABELS[category] ?? category;
  }

  statusLabel(status: FeedbackStatus): string {
    return STATUS_LABELS[status] ?? status;
  }

  latestReplyAt(item: FeedbackItem): string | undefined {
    return item.replies.at(-1)?.at;
  }
}
