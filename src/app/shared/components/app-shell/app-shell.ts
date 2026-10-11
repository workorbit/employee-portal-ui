import { Component, Input, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../../store/auth/auth.actions';
import { selectUser } from '../../../store/auth/auth.selectors';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  private readonly store = inject(Store);

  @Input() pageTitle = '';

  protected readonly user = this.store.selectSignal(selectUser);

  protected readonly displayName = computed(() => {
    const user = this.user();
    return user?.name || user?.email || '';
  });

  protected readonly initials = computed(() => {
    const name = this.displayName();
    return name.trim().charAt(0).toUpperCase() || '?';
  });

  /** Desktop icon-rail collapse — deliberately not persisted, always starts
   * expanded on a fresh load. Mobile ignores this entirely — it has its own
   * fixed icon-only bottom nav bar instead of a collapsible sidebar. */
  protected readonly collapsed = signal(false);

  /** Header profile dropdown — closed on route nav, logout, or backdrop click. */
  protected readonly profileMenuOpen = signal(false);

  toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen.update((open) => !open);
  }

  closeProfileMenu(): void {
    this.profileMenuOpen.set(false);
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
