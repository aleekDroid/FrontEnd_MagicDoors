import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { environment } from '../config/environment';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatarInitials: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── Mock users (used when USE_MOCK = true) ──────────────────────────────────
const MOCK_USERS: (User & { password: string })[] = [
  { id: '1', name: 'Administrador', email: 'admin@escuela.edu', password: 'admin123', role: 'admin', avatarInitials: 'AD' },
  { id: '2', name: 'Juan Martínez', email: 'juan@escuela.edu',  password: 'user123',  role: 'user',  avatarInitials: 'JM' },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  // ── Set to false to use the real backend ─────────────────────────────────
  private readonly USE_MOCK = false;
  private readonly API_URL = `${environment.apiUrl}/usuarios`;

  private readonly TOKEN_KEY = 'edu_token';
  private readonly USER_KEY  = 'edu_user';

  currentUser = signal<User | null>(this.loadStoredUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    if (this.USE_MOCK) return this.mockLogin(credentials);
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(res => this.storeSession(res))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean { return !!localStorage.getItem(this.TOKEN_KEY); }
  isAdmin():         boolean { return this.currentUser()?.role === 'admin'; }
  getToken():        string | null { return localStorage.getItem(this.TOKEN_KEY); }

  private mockLogin(credentials: LoginCredentials): Observable<AuthResponse> {
    const found = MOCK_USERS.find(u => u.email === credentials.email && u.password === credentials.password);
    if (!found) return throwError(() => new Error('Credenciales incorrectas. Intenta de nuevo.'));
    const { password, ...user } = found;
    return of({ token: `mock-token-${user.id}`, user }).pipe(
      delay(600),
      tap(res => this.storeSession(res))
    );
  }

  storeSession(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private loadStoredUser(): User | null {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }
}
