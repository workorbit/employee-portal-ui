import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthActions } from './store/auth/auth.actions';
import { ToastTray } from './shared/components/toast-tray/toast-tray';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastTray],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  constructor(private readonly store: Store) {}

  ngOnInit(): void {
    // Silently attempt to restore a session from the refresh_token cookie
    // on every fresh load (page reload, direct URL visit, etc.).
    this.store.dispatch(AuthActions.restoreSession());
  }
}
