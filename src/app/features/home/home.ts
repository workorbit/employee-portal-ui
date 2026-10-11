import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectIsAuthenticated } from '../../store/auth/auth.selectors';
import { Icon } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, Icon],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements AfterViewInit, OnDestroy {
  private readonly store = inject(Store);

  protected readonly isAuthenticated = this.store.selectSignal(selectIsAuthenticated);
  protected readonly year = new Date().getFullYear();
  protected readonly todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Hero process strip — the real Timesheet → PayrollRun workflow, condensed
  // to three plain steps so a first-time visitor sees the whole point of the
  // app in one glance, with no metaphor to decode.
  protected readonly processSteps = [
    { icon: 'clock', label: 'Log your hours' },
    { icon: 'check', label: 'Get them approved' },
    { icon: 'payroll', label: 'Payroll takes over' },
  ] as const;

  // Mirrors the new-tab behavior login already uses: an already-signed-in
  // visitor clicking "Go to dashboard" from Home gets the dashboard in a new
  // tab rather than losing this page. If the browser blocks the popup,
  // navigate this tab there directly instead of silently doing nothing.
  openDashboardInNewTab(event: Event): void {
    event.preventDefault();
    const tab = window.open('/dashboard', '_blank');
    if (!tab || tab.closed) {
      window.location.href = '/dashboard';
    }
  }

  // Header switches from a plain bar to the glass effect once the page has
  // scrolled past the point where it'd otherwise sit flush with the top.
  protected readonly scrolled = signal(window.scrollY > 8);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scrolled.set(window.scrollY > 8);
  }

  // ---------- Features: pinned horizontal card scroller ----------
  // `.features-layout` is `position: sticky`, so it holds its position on
  // screen — the page visually doesn't move, cursor included — for as
  // long as its containing `.features-pin-wrap` still has extra height
  // below it. Each wheel tick over the cards is redirected into
  // `scrollLeft` instead of page scroll, consuming that extra height.
  // Once the last card is reached, the handler stops intercepting and the
  // page scrolls normally straight past — with no leftover height, so
  // there's no dead zone where the section sits frozen with nothing left
  // to scroll horizontally.
  protected readonly featureScroller = viewChild<ElementRef<HTMLDivElement>>('featureScroller');
  protected readonly featuresLayout = viewChild<ElementRef<HTMLDivElement>>('featuresLayout');

  // Extra pixels of scroll room the wrap needs below the sticky layout —
  // recalculated whenever the card row's content or viewport width
  // changes, so it always matches exactly how far the cards can travel.
  protected readonly pinWrapExtraHeight = signal(0);

  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this.recalcPinRoom();

    const scrollerEl = this.featureScroller()?.nativeElement;
    if (scrollerEl && 'ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => this.recalcPinRoom());
      this.resizeObserver.observe(scrollerEl);
    }

    // Card widths can shift slightly once web fonts finish swapping in —
    // recheck shortly after window `load` fires.
    window.addEventListener('load', () => setTimeout(() => this.recalcPinRoom(), 500), { once: true });
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.recalcPinRoom();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private recalcPinRoom(): void {
    const scrollerEl = this.featureScroller()?.nativeElement;
    if (!scrollerEl) return;
    // Below the 900px breakpoint the layout un-pins entirely (see
    // home.scss) — no extra height needed, cards just scroll natively.
    if (window.innerWidth <= 900) {
      this.pinWrapExtraHeight.set(0);
      return;
    }
    this.pinWrapExtraHeight.set(Math.max(0, scrollerEl.scrollWidth - scrollerEl.clientWidth));
  }

  onFeaturesWheel(event: WheelEvent): void {
    const el = this.featureScroller()?.nativeElement;
    if (!el || el.scrollWidth <= el.clientWidth) return;

    const scrollingForward = event.deltaY > 0;
    const atStart = el.scrollLeft <= 0;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;

    if ((scrollingForward && atEnd) || (!scrollingForward && atStart)) {
      // No horizontal room left this way — release the pin and let the
      // page scroll past normally instead of trapping the user here.
      return;
    }

    event.preventDefault();
    el.scrollLeft += event.deltaY;
  }

  protected readonly navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'FAQ', href: '#faq' },
  ] as const;

  protected readonly capabilities = [
    {
      title: 'Log hours by the day',
      description:
        "Add entries for a pay period, save a draft while it's still in progress, and submit it for review when it's ready.",
      icon: 'clock',
      comingSoon: false,
    },
    {
      title: 'Track every approval',
      description:
        'Each timesheet keeps its full status and remarks thread, so you always know exactly why something was approved or sent back.',
      icon: 'check',
      comingSoon: false,
    },
    {
      title: 'Two-step secure login',
      description:
        'Password plus a one-time code sent to your email. No one gets into your record with a password alone.',
      icon: 'lock',
      comingSoon: false,
    },
    {
      title: 'Reports built in',
      description:
        'A running total of your hours, approvals, and pay — all in one report, always up to date.',
      icon: 'insights',
      comingSoon: false,
    },
  ] as const;

  protected readonly features = [
    {
      title: 'Timesheets',
      description: 'Log your hours day by day and submit them for approval in a couple of clicks.',
      icon: 'timesheets',
    },
    {
      title: 'Payroll',
      description: 'See every payslip the moment it is processed, with a full history to look back on.',
      icon: 'payroll',
    },
    {
      title: 'Feedback',
      description: 'Raise a concern or a suggestion and track its status until you get a reply.',
      icon: 'feedback',
    },
    {
      title: 'Reports',
      description: 'Your full timesheet and payroll history, plus a running summary of both.',
      icon: 'insights',
    },
  ] as const;

  protected readonly steps = [
    {
      title: 'Log your hours',
      description: 'Add your daily entries, save drafts as you go, and submit the period for review when it’s ready.',
    },
    {
      title: 'Your manager reviews it',
      description: 'Watch each timesheet move through review with a full remarks thread — once it’s approved, it moves into the next payroll run.',
    },
  ] as const;

  protected readonly faqs = [
    {
      question: "I don't have an account — can I sign up?",
      answer:
        "No — employee accounts are created by your employer, not self-registered. If you don't have login details yet, ask your HR admin to set up your account and share your login email.",
    },
    {
      question: 'Where does the verification code go?',
      answer:
        "To the email address on file with your employer. If it doesn't arrive within a minute, use Resend on the verification screen — check your spam folder first.",
    },
    {
      question: 'Can I edit a timesheet or payroll claim after I submit it?',
      answer:
        "Not once it's submitted — it locks while pending review, and stays locked once approved (or paid, for a payroll claim). You can freely edit anything still saved as a draft. If either one is rejected, it reopens for editing so you can revise and resubmit that same record.",
    },
    {
      question: 'What if I forget my password?',
      answer:
        "Use the reset link on the login screen. You'll still need to verify with a one-time code afterward — resetting your password doesn't skip that step.",
    },
    {
      question: 'Is my data visible to other employees?',
      answer:
        "No. Every screen you see is scoped to your own account — your timesheets, your history, your profile. Other employees can't see it, and you can't see theirs.",
    },
    {
      question: 'When will payroll and feedback be available here?',
      answer:
        'Both are being built now. The systems behind them are already live — the screens to view your payslips and raise feedback directly are coming next.',
    },
  ] as const;

  protected readonly openFaqIndex = signal<number | null>(0);

  toggleFaq(index: number): void {
    this.openFaqIndex.update((current) => (current === index ? null : index));
  }
}