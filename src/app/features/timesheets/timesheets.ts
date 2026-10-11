import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppShell } from '../../shared/components/app-shell/app-shell';
import { Icon } from '../../shared/components/icon/icon';
import { TimesheetsActions, TimesheetsListFilters } from '../../store/timesheets/timesheets.actions';
import {
  selectTimesheets,
  selectTimesheetsListItems,
  selectTimesheetsListLoading,
  selectTimesheetsListTotal,
  selectTimesheetsLoading,
  selectTimesheetsSaving,
} from '../../store/timesheets/timesheets.selectors';
import { selectUser } from '../../store/auth/auth.selectors';
import {
  Timesheet,
  TimesheetEntry,
  TimesheetEntryStatus,
  TimesheetPeriodType,
  TimesheetStatus,
} from '../../shared/models/timesheet.model';

type ViewMode = 'weekly' | 'monthly';
type PageView = 'list' | 'calendar';

interface DayCell {
  iso: string;
  date: Date;
  dayLabel: string;
  isWeekend: boolean;
}

interface DayDraft {
  status: TimesheetEntryStatus;
  hours: number;
  comment: string;
}

const HOURS_PER_DAY = 8;
const LIST_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const NON_WORKING_STATUSES = new Set([
  TimesheetEntryStatus.WEEKEND,
  TimesheetEntryStatus.HOLIDAY,
  TimesheetEntryStatus.LEAVE,
  TimesheetEntryStatus.SICK_LEAVE,
]);

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfWeek(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

// ---------- Company pay-cycle helpers ----------
// A "monthly" period labeled "YYYY-MM" means the cycle starting on day
// `cycleStartDay` of month MM and ending the day before that same day the
// following month. When cycleStartDay is 1 (the default), this reduces to
// exactly the plain calendar month — every one of these functions is a
// no-op generalization of the old hardcoded 1st-to-last-day behavior.

function periodKeyForCycle(date: Date, cycleStartDay: number): string {
  let year = date.getFullYear();
  let month = date.getMonth();
  if (date.getDate() < cycleStartDay) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function cycleStart(period: string, cycleStartDay: number): Date {
  const [year, month] = period.split('-').map(Number);
  return new Date(year, month - 1, cycleStartDay);
}

// cycleStartDay is capped at 28, so `cycleStartDay - 1` (minimum 27) is
// always a valid day in the following month — no leap-year edge case.
function cycleEnd(period: string, cycleStartDay: number): Date {
  const [year, month] = period.split('-').map(Number);
  return new Date(year, month, cycleStartDay - 1);
}

// Standard ISO-8601 week number (Monday-start weeks, week 1 contains the
// year's first Thursday).
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

@Component({
  selector: 'app-timesheets',
  standalone: true,
  imports: [FormsModule, DatePipe, AppShell, Icon],
  templateUrl: './timesheets.html',
  styleUrl: './timesheets.scss',
})
export class Timesheets implements OnInit {
  private readonly store = inject(Store);

  protected readonly TimesheetEntryStatus = TimesheetEntryStatus;
  protected readonly TimesheetStatus = TimesheetStatus;
  protected readonly statusOptions = [
    { value: TimesheetEntryStatus.PRESENT, label: 'Present' },
    { value: TimesheetEntryStatus.WFH, label: 'WFH' },
    { value: TimesheetEntryStatus.LEAVE, label: 'Leave' },
    { value: TimesheetEntryStatus.SICK_LEAVE, label: 'Sick Leave' },
    { value: TimesheetEntryStatus.HOLIDAY, label: 'Holiday' },
    { value: TimesheetEntryStatus.WEEKEND, label: 'Weekend' },
  ];
  protected readonly timesheetStatusOptions = [
    { value: TimesheetStatus.DRAFT, label: 'Draft' },
    { value: TimesheetStatus.PENDING, label: 'Pending' },
    { value: TimesheetStatus.APPROVED, label: 'Approved' },
    { value: TimesheetStatus.REJECTED, label: 'Rejected' },
  ];

  protected readonly timesheets = this.store.selectSignal(selectTimesheets);
  protected readonly loading = this.store.selectSignal(selectTimesheetsLoading);
  protected readonly saving = this.store.selectSignal(selectTimesheetsSaving);

  private readonly user = this.store.selectSignal(selectUser);
  protected readonly cycleStartDay = computed(() => this.user()?.payCycleStartDay ?? 1);

  // ---------- Page-level: List vs Calendar ----------

  protected readonly pageView = signal<PageView>('list');

  setPageView(view: PageView): void {
    this.pageView.set(view);
  }

  // ---------- "My Timesheets" list: filters + pagination ----------

  protected readonly listItems = this.store.selectSignal(selectTimesheetsListItems);
  protected readonly listTotal = this.store.selectSignal(selectTimesheetsListTotal);
  protected readonly listLoading = this.store.selectSignal(selectTimesheetsListLoading);

  protected readonly listStatusFilter = signal<TimesheetStatus | ''>('');
  protected readonly listEntryStatusFilter = signal<TimesheetEntryStatus | ''>('');
  protected readonly listPeriodTypeFilter = signal<TimesheetPeriodType | ''>('');
  protected readonly listDateFrom = signal('');
  protected readonly listDateTo = signal('');
  /** Bound to the search box immediately; `listSearch` below is the
   * debounced value that actually drives the API call. */
  protected readonly listSearchInput = signal('');
  private readonly listSearch = signal('');
  private searchDebounceTimer?: ReturnType<typeof setTimeout>;
  protected readonly listPage = signal(1);

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.listTotal() / LIST_PAGE_SIZE)),
  );

  protected readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );

  protected readonly showingRangeLabel = computed(() => {
    const total = this.listTotal();
    if (total === 0) return 'Showing 0 entries';
    const start = (this.listPage() - 1) * LIST_PAGE_SIZE + 1;
    const end = Math.min(total, this.listPage() * LIST_PAGE_SIZE);
    return `Showing ${start} to ${end} of ${total} entries`;
  });

  private readonly currentListFilters = computed<TimesheetsListFilters>(() => ({
    status: this.listStatusFilter() || undefined,
    entryStatus: this.listEntryStatusFilter() || undefined,
    periodType: this.listPeriodTypeFilter() || undefined,
    dateFrom: this.listDateFrom() || undefined,
    dateTo: this.listDateTo() || undefined,
    search: this.listSearch() || undefined,
  }));

  setListStatusFilter(value: string): void {
    this.listStatusFilter.set(value as TimesheetStatus | '');
    this.listPage.set(1);
  }

  setListEntryStatusFilter(value: string): void {
    this.listEntryStatusFilter.set(value as TimesheetEntryStatus | '');
    this.listPage.set(1);
  }

  setListPeriodTypeFilter(value: string): void {
    this.listPeriodTypeFilter.set(value as TimesheetPeriodType | '');
    this.listPage.set(1);
  }

  setListDateFrom(value: string): void {
    this.listDateFrom.set(value);
    this.listPage.set(1);
  }

  setListDateTo(value: string): void {
    this.listDateTo.set(value);
    this.listPage.set(1);
  }

  setListSearch(value: string): void {
    this.listSearchInput.set(value);
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.listSearch.set(value);
      this.listPage.set(1);
    }, SEARCH_DEBOUNCE_MS);
  }

  goToPage(page: number): void {
    this.listPage.set(Math.min(Math.max(1, page), this.totalPages()));
  }

  // ---------- List tab: sort + filter chips ----------

  protected readonly listSortOrder = signal<'newest' | 'oldest'>('newest');

  // Flips the order of the current, already-server-sorted page — a purely
  // client-side toggle, not a re-query, so it only reorders what's already
  // on screen rather than re-sorting across the whole filtered set.
  protected readonly sortedListItems = computed(() => {
    const items = this.listItems();
    return this.listSortOrder() === 'oldest' ? [...items].reverse() : items;
  });

  setListSortOrder(value: string): void {
    this.listSortOrder.set(value === 'oldest' ? 'oldest' : 'newest');
  }

  protected readonly showFiltersPanel = signal(false);

  toggleFiltersPanel(): void {
    this.showFiltersPanel.update((open) => !open);
  }

  protected readonly activeFilterChips = computed(() => {
    const chips: { key: string; label: string }[] = [];
    if (this.listStatusFilter()) {
      const opt = this.timesheetStatusOptions.find((o) => o.value === this.listStatusFilter());
      chips.push({ key: 'status', label: `Status: ${opt?.label ?? this.listStatusFilter()}` });
    }
    if (this.listPeriodTypeFilter()) {
      const label = this.listPeriodTypeFilter() === TimesheetPeriodType.WEEKLY ? 'Weekly' : 'Monthly';
      chips.push({ key: 'periodType', label: `Type: ${label}` });
    }
    if (this.listDateFrom()) {
      chips.push({ key: 'dateFrom', label: `From: ${this.listDateFrom()}` });
    }
    if (this.listDateTo()) {
      chips.push({ key: 'dateTo', label: `To: ${this.listDateTo()}` });
    }
    if (this.listSearchInput()) {
      chips.push({ key: 'search', label: `Search: "${this.listSearchInput()}"` });
    }
    return chips;
  });

  protected readonly hasActiveFilters = computed(() => this.activeFilterChips().length > 0);

  removeFilterChip(key: string): void {
    switch (key) {
      case 'status':
        this.setListStatusFilter('');
        break;
      case 'periodType':
        this.setListPeriodTypeFilter('');
        break;
      case 'dateFrom':
        this.setListDateFrom('');
        break;
      case 'dateTo':
        this.setListDateTo('');
        break;
      case 'search':
        this.clearSearchNow();
        break;
    }
  }

  clearAllFilters(): void {
    this.setListStatusFilter('');
    this.setListPeriodTypeFilter('');
    this.setListDateFrom('');
    this.setListDateTo('');
    this.clearSearchNow();
  }

  private clearSearchNow(): void {
    clearTimeout(this.searchDebounceTimer);
    this.listSearchInput.set('');
    this.listSearch.set('');
    this.listPage.set(1);
  }

  // ⌘K / Ctrl+K jumps straight to the search box — only while the List tab
  // is actually showing it.
  private readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  @HostListener('document:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent): void {
    if (this.pageView() !== 'list') return;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.searchInputRef()?.nativeElement.focus();
    }
  }

  // Drives the "Current Week" pill on an entry card in the List tab.
  protected readonly currentWeekPeriodKey = computed(() => toIsoDate(startOfWeek(new Date())));

  periodRangeLabel(timesheet: Timesheet): string {
    const format = (d: Date) => `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`;
    if (timesheet.periodType === TimesheetPeriodType.MONTHLY) {
      const [year, month] = timesheet.period.split('-').map(Number);
      const cycleStartDay = this.cycleStartDay();
      // Plain "Mon YYYY" for the default calendar-month case — the exact
      // range only needs spelling out once it's no longer the 1st-to-last.
      if (cycleStartDay === 1) {
        return `${MONTH_ABBR[month - 1]} ${year}`;
      }
      const start = cycleStart(timesheet.period, cycleStartDay);
      const end = cycleEnd(timesheet.period, cycleStartDay);
      return `${format(start)} – ${format(end)}, ${end.getFullYear()}`;
    }
    const start = new Date(`${timesheet.period}T00:00:00`);
    const end = addDays(start, 6);
    return `${format(start)} – ${format(end)}, ${end.getFullYear()}`;
  }

  periodWeekLabel(timesheet: Timesheet): string {
    if (timesheet.periodType === TimesheetPeriodType.MONTHLY) {
      return 'Monthly';
    }
    return `Week ${getISOWeek(new Date(`${timesheet.period}T00:00:00`))}`;
  }

  viewPeriodInCalendar(timesheet: Timesheet): void {
    this.viewMode.set(timesheet.periodType === TimesheetPeriodType.MONTHLY ? 'monthly' : 'weekly');
    this.anchorDate.set(
      timesheet.periodType === TimesheetPeriodType.MONTHLY
        ? cycleStart(timesheet.period, this.cycleStartDay())
        : new Date(`${timesheet.period}T00:00:00`),
    );
    this.pageView.set('calendar');
  }

  submittedOnFor(timesheet: Timesheet): string | undefined {
    const submitted = [...timesheet.statusHistory].reverse().find((e) => e.status === TimesheetStatus.PENDING);
    return submitted?.changedAt;
  }

  // ---------- Calendar tab ----------

  protected readonly viewMode = signal<ViewMode>('weekly');
  protected readonly anchorDate = signal<Date>(new Date());
  protected readonly dayEntries = signal<Record<string, DayDraft>>({});
  protected readonly periodComment = signal('');

  private readonly pendingAutoSubmit = signal(false);
  /** Set the moment the user clicks Submit Timesheet — once the submit
   * actually lands (status flips to pending), we navigate back to the
   * list and reset this tab to a fresh, empty state. */
  private readonly awaitingSubmitCompletion = signal(false);

  protected readonly periodType = computed<TimesheetPeriodType>(() =>
    this.viewMode() === 'weekly' ? TimesheetPeriodType.WEEKLY : TimesheetPeriodType.MONTHLY,
  );

  protected readonly weekDays = computed<DayCell[]>(() => {
    const monday = startOfWeek(this.anchorDate());
    return Array.from({ length: 7 }, (_, i) => this.toDayCell(addDays(monday, i)));
  });

  protected readonly monthDays = computed<DayCell[]>(() => {
    const cycleStartDay = this.cycleStartDay();
    const period = periodKeyForCycle(this.anchorDate(), cycleStartDay);
    const start = cycleStart(period, cycleStartDay);
    const end = cycleEnd(period, cycleStartDay);
    const numDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    return Array.from({ length: numDays }, (_, i) => this.toDayCell(addDays(start, i)));
  });

  protected readonly visibleDays = computed<DayCell[]>(() =>
    this.viewMode() === 'monthly' ? this.monthDays() : this.weekDays(),
  );

  protected readonly periodKey = computed(() => {
    if (this.viewMode() === 'weekly') {
      return toIsoDate(startOfWeek(this.anchorDate()));
    }
    return periodKeyForCycle(this.anchorDate(), this.cycleStartDay());
  });

  protected readonly rangeLabel = computed(() => {
    const days = this.viewMode() === 'weekly' ? this.weekDays() : this.monthDays();
    if (days.length === 0) return '';
    const format = (d: Date) =>
      `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
    return `${format(days[0].date)} - ${format(days[days.length - 1].date)}`;
  });

  // ---------- Range-label date picker ----------
  // Clicking the range label opens the browser's native calendar picker
  // directly (via showPicker()) instead of only stepping via the prev/next
  // arrows or showing a boxed date-input form first. Picking a date jumps
  // the anchor straight to the week/month containing it — Weekly/Monthly
  // still governs the span.

  private readonly rangeDateInput = viewChild<ElementRef<HTMLInputElement>>('rangeDateInput');

  protected readonly customFromDate = computed(() => {
    const days = this.viewMode() === 'weekly' ? this.weekDays() : this.monthDays();
    return days.length ? toIsoDate(days[0].date) : '';
  });

  // Monthly shows From/To as two visible fields instead of the single
  // hidden-input-behind-a-label trick weekly uses — To is read-only (the
  // period is always a full calendar month) but seeing both boundaries
  // explicitly is clearer than one combined label for a month-long span.
  protected readonly customToDate = computed(() => {
    const days = this.viewMode() === 'weekly' ? this.weekDays() : this.monthDays();
    return days.length ? toIsoDate(days[days.length - 1].date) : '';
  });

  openRangePicker(): void {
    const input = this.rangeDateInput()?.nativeElement;
    if (input && typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch {
        // Browsers can throw if the call isn't trusted enough or a picker
        // is already open — either way there's nothing useful to do.
      }
    }
  }

  setCustomFrom(value: string): void {
    if (!value) return;
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return;
    this.anchorDate.set(date);
  }

  protected readonly currentTimesheet = computed<Timesheet | undefined>(() =>
    this.timesheets().find(
      (t) => t.period === this.periodKey() && t.periodType === this.periodType(),
    ),
  );

  protected readonly isLocked = computed(() => {
    const status = this.currentTimesheet()?.status;
    return status === TimesheetStatus.PENDING || status === TimesheetStatus.APPROVED;
  });

  // Shown right at the top of a locked period, before the (disabled) grid
  // itself — otherwise a disabled form with no visible explanation nearby
  // just looks broken instead of intentionally read-only.
  protected readonly lockMessage = computed(() => {
    const status = this.currentTimesheet()?.status;
    if (status === TimesheetStatus.APPROVED) {
      return 'This timesheet has been approved and can no longer be edited.';
    }
    if (status === TimesheetStatus.PENDING) {
      return 'This timesheet is pending approval and can’t be edited until your manager reviews it.';
    }
    return '';
  });

  protected readonly totalHours = computed(() =>
    Object.values(this.dayEntries()).reduce((sum, entry) => sum + entry.hours, 0),
  );

  protected readonly workingDaysCount = computed(
    () => this.visibleDays().filter((d) => !d.isWeekend).length,
  );

  protected readonly leaveDaysCount = computed(
    () =>
      Object.values(this.dayEntries()).filter(
        (entry) =>
          entry.status === TimesheetEntryStatus.LEAVE ||
          entry.status === TimesheetEntryStatus.SICK_LEAVE,
      ).length,
  );

  protected readonly overtimeHours = computed(() =>
    Math.max(0, this.totalHours() - this.workingDaysCount() * HOURS_PER_DAY),
  );

  protected readonly submittedOn = computed(() => {
    const history = this.currentTimesheet()?.statusHistory ?? [];
    const submitted = [...history].reverse().find((e) => e.status === TimesheetStatus.PENDING);
    return submitted?.changedAt;
  });

  constructor() {
    // Reload the visible period's saved progress whenever the window
    // (week/month) changes or the store refreshes after a save.
    effect(() => {
      const timesheet = this.currentTimesheet();
      const days = this.visibleDays();
      const draft: Record<string, DayDraft> = {};
      for (const day of days) {
        const saved = timesheet?.entries.find((e) => e.date === day.iso);
        draft[day.iso] = saved
          ? { status: saved.status, hours: saved.hours, comment: saved.task ?? '' }
          : {
              status: day.isWeekend ? TimesheetEntryStatus.WEEKEND : TimesheetEntryStatus.PRESENT,
              hours: day.isWeekend ? 0 : HOURS_PER_DAY,
              comment: '',
            };
      }
      this.dayEntries.set(draft);
      this.periodComment.set(timesheet?.comment ?? '');
    });

    // Fire the deferred submit once the draft we just saved shows up in the store.
    effect(() => {
      const timesheet = this.currentTimesheet();
      if (this.pendingAutoSubmit() && timesheet && !this.saving()) {
        this.pendingAutoSubmit.set(false);
        this.store.dispatch(TimesheetsActions.submitTimesheet({ id: timesheet.id }));
      }
    });

    // Once a Calendar-tab submit actually lands, jump back to the list and
    // reset this tab to a fresh week so it's ready for the next entry.
    effect(() => {
      if (!this.awaitingSubmitCompletion()) return;
      const timesheet = this.currentTimesheet();
      if (timesheet?.status === TimesheetStatus.PENDING && !this.saving()) {
        this.awaitingSubmitCompletion.set(false);
        this.pageView.set('list');
        this.viewMode.set('weekly');
        this.anchorDate.set(new Date());
      }
    });

    // Drives the "My Timesheets" list — reloads whenever a filter, the
    // page, or the tab itself changes.
    effect(() => {
      const filters = this.currentListFilters();
      const page = this.listPage();
      if (this.pageView() !== 'list') return;
      this.store.dispatch(TimesheetsActions.loadTimesheetsPage({ filters, page, limit: LIST_PAGE_SIZE }));
    });
  }

  ngOnInit(): void {
    this.store.dispatch(TimesheetsActions.loadTimesheets());
  }

  private toDayCell(date: Date): DayCell {
    const day = date.getDay();
    return {
      iso: toIsoDate(date),
      date,
      dayLabel: DAY_LABELS[day],
      isWeekend: day === 0 || day === 6,
    };
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  navigatePrev(): void {
    this.anchorDate.update((d) => (this.viewMode() === 'weekly' ? addDays(d, -7) : addMonths(d, -1)));
  }

  navigateNext(): void {
    this.anchorDate.update((d) => (this.viewMode() === 'weekly' ? addDays(d, 7) : addMonths(d, 1)));
  }

  setDayStatus(iso: string, status: TimesheetEntryStatus): void {
    const isNonWorking = NON_WORKING_STATUSES.has(status);
    this.dayEntries.update((entries) => {
      const current = entries[iso];
      const hours = isNonWorking ? 0 : current.hours || HOURS_PER_DAY;
      return { ...entries, [iso]: { ...current, status, hours } };
    });
  }

  updateHours(iso: string, hours: string): void {
    const value = Math.max(0, Number(hours) || 0);
    this.dayEntries.update((entries) => ({ ...entries, [iso]: { ...entries[iso], hours: value } }));
  }

  updateDayComment(iso: string, comment: string): void {
    this.dayEntries.update((entries) => ({ ...entries, [iso]: { ...entries[iso], comment } }));
  }

  updatePeriodComment(value: string): void {
    this.periodComment.set(value);
  }

  private buildEntries(): TimesheetEntry[] {
    const entries = this.dayEntries();
    return this.visibleDays().map((day) => ({
      date: day.iso,
      hours: entries[day.iso].hours,
      task: entries[day.iso].comment || undefined,
      status: entries[day.iso].status,
    }));
  }

  saveDraft(): void {
    const payload = {
      period: this.periodKey(),
      periodType: this.periodType(),
      entries: this.buildEntries(),
      comment: this.periodComment() || undefined,
    };
    const existing = this.currentTimesheet();
    if (existing) {
      this.store.dispatch(TimesheetsActions.updateDraft({ id: existing.id, ...payload }));
    } else {
      this.store.dispatch(TimesheetsActions.saveDraft(payload));
    }
  }

  submitTimesheet(): void {
    this.awaitingSubmitCompletion.set(true);
    const existing = this.currentTimesheet();
    if (existing) {
      this.store.dispatch(TimesheetsActions.submitTimesheet({ id: existing.id }));
    } else {
      this.pendingAutoSubmit.set(true);
      this.saveDraft();
    }
  }
}
