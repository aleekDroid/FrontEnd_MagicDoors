import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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

  loading     = signal(false);
  errorMsg    = signal('');
  showPass    = signal(false);

  form: FormGroup = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(3)]],
    remember: [false],
  });

  get f() { return this.form.controls; }

  togglePass(): void { this.showPass.update(v => !v); }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;

    this.errorMsg.set('');
    this.loading.set(true);

    this.auth.login({
      email:    this.f['email'].value,
      password: this.f['password'].value,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/home']);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.errorMsg.set(err.message ?? 'Error al iniciar sesión.');
      },
    });
  }

  // Demo fill helpers
  fillAdmin(): void { this.form.patchValue({ email: 'admin@gmail.com',  password: 'admin123' }); }
  fillUser():  void { this.form.patchValue({ email: 'juan@escuela.edu',   password: 'user123'  }); }
}
