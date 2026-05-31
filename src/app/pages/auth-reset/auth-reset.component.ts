import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-reset',
  standalone: true,
  templateUrl: './auth-reset.component.html',
  styleUrl: './auth-reset.component.css',
})
export class AuthResetComponent implements OnInit {
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    await this.router.navigateByUrl('/auth/login');
  }
}