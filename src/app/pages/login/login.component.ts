import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private http   = inject(HttpClient);

  loading     = signal(false);
  errorMsg    = signal('');
  showPass    = signal(false);
  
  step        = signal<'login' | '2fa'>('login');
  userEmail   = signal('');

  form: FormGroup = this.fb.group({
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.required, Validators.minLength(3)]],
    remember:  [false],
    codigo2fa: ['', [Validators.pattern(/^\d{6}$/)]]
  });

  get f() { return this.form.controls; }

  togglePass(): void { this.showPass.update(v => !v); }

  onSubmit(): void {
    if (this.loading()) return;

    if (this.step() === 'login') {
      if (this.f['email'].invalid || this.f['password'].invalid) {
        this.form.markAllAsTouched();
        return;
      }

      this.errorMsg.set('');
      this.loading.set(true);

      this.auth.login({
        email:    this.f['email'].value,
        password: this.f['password'].value,
      }).subscribe({
        next: (res: any) => {
          this.loading.set(false);
          
          // Si el backend nos pide 2FA, cambiamos de pantalla.
          if (res.requires2FA) {
            this.userEmail.set(res.email);
            this.step.set('2fa');
            this.f['codigo2fa'].setValidators([Validators.required, Validators.pattern(/^\d{6}$/)]);
            this.f['codigo2fa'].updateValueAndValidity();
          } else {
            this.guardarSesionYNavegar(res);
          }
        },
        error: (err: any) => {
          this.loading.set(false);
          this.errorMsg.set(err.error?.mensaje || err.message || 'Error al iniciar sesión.');
        },
      });
    } 
    else if (this.step() === '2fa') {
      if (this.f['codigo2fa'].invalid) {
        this.form.markAllAsTouched();
        return;
      }

      this.errorMsg.set('');
      this.loading.set(true);

      this.http.post<any>(`${environment.apiUrl}/usuarios/verificar-2fa`, {
        email: this.userEmail(),
        codigo: this.f['codigo2fa'].value
      }).subscribe({
        next: (res) => {
          this.loading.set(false);
          this.guardarSesionYNavegar(res);
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMsg.set(err.error?.mensaje || 'Código inválido o expirado.');
        }
      });
    }
  }

  volverAlLogin(): void {
    this.step.set('login');
    this.f['codigo2fa'].reset();
    this.errorMsg.set('');
  }

  private guardarSesionYNavegar(res: any): void {
    localStorage.setItem('token', res.token);
    if (res.user) {
      localStorage.setItem('usuario', JSON.stringify(res.user));
    }
    window.location.href = '/home';
  }
}