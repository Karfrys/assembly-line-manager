import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { User, AuthResponse } from '../models';

const API_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    const stored = localStorage.getItem('alm_user');
    if (stored) {
      try {
        this.currentUserSubject.next(JSON.parse(stored));
      } catch {
        this.currentUserSubject.next(null);
      }
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, { email, password }).pipe(
      tap(res => this.handleAuth(res)),
      catchError(err => throwError(() => err))
    );
  }

  register(email: string, password: string, name: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/register`, { email, password, name }).pipe(
      tap(res => this.handleAuth(res)),
      catchError(err => throwError(() => err))
    );
  }

  logout(): void {
    localStorage.removeItem('alm_token');
    localStorage.removeItem('alm_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('alm_token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${API_URL}/auth/me`).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        localStorage.setItem('alm_user', JSON.stringify(user));
      })
    );
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private handleAuth(res: AuthResponse): void {
    localStorage.setItem('alm_token', res.token);
    localStorage.setItem('alm_user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }
}
