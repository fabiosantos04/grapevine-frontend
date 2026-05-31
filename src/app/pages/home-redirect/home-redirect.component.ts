import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-home-redirect',
  standalone: true,
  templateUrl: './home-redirect.component.html',
  styleUrl: './home-redirect.component.css',
})
export class HomeRedirectComponent implements OnInit {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    await this.auth.ready;
    await this.router.navigateByUrl(this.auth.user() ? '/app/dashboard' : '/auth/login');
  }
}