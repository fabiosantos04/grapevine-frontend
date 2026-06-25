import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { from } from 'rxjs';

const EXCLUDED_PATHS = ['/auth/login', '/auth/refresh', '/auth/forgot-password'];

let isRefreshing  = false;
const tokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (isExcluded(req.url)) return next(req);

  const token = auth.getToken();
  const reqWithToken = token ? addToken(req, token) : req;

  return next(reqWithToken).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403) {
        return handle403(req, next, auth, router);
      }
      return throwError(() => error);
    })
  );
};

function handle403(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
  router: Router
) {
  if (isRefreshing) {
    // Hay un refresh en curso — encolar esta petición hasta que termine
    return tokenSubject.pipe(
      filter(t => t !== null),
      take(1),
      switchMap(token => next(addToken(req, token!)))
    );
  }

  isRefreshing = true;
  tokenSubject.next(null);

  return from(auth.refreshToken()).pipe(
    switchMap(response => {
      isRefreshing = false;
      tokenSubject.next(response.token);
      return next(addToken(req, response.token));
    }),
    catchError(err => {
      isRefreshing = false;
      auth.signOut();
      router.navigateByUrl('/auth/login');
      return throwError(() => err);
    })
  );
}

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
}

function isExcluded(url: string): boolean {
  return EXCLUDED_PATHS.some(path => url.includes(path));
}