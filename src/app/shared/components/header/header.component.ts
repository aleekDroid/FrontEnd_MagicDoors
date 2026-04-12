import { Component, computed, HostListener, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../core/config/environment';

interface NavItem {
  label:      string;
  route:      string;
  icon:       string;
  adminOnly?: boolean;
}

export interface Anomalia {
  id:          number;
  timestamp:   string;
  aula:        string;
  usuario_id:  number;
  usuario_nombre?: string;
  motivo:      string;
  estado_aula_snapshot: string;
}

// Convierte la clave de BD a un texto legible para el usuario
const MOTIVO_LABELS: Record<string, string> = {
  llegada_tarde:           'Llegada fuera de rango',
  fuera_de_ventana:        'Fuera de horario',
  sin_sesion_programada:   'Sin clase programada',
  aula_ocupada_otro_profesor: 'Aula ocupada por otro docente',
  aula_en_mantenimiento:   'Aula en mantenimiento',
  llegada_anticipada:      'Llegada anticipada',
};

@Component({
  selector:    'app-header',
  standalone:  true,
  imports:     [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl:    './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  auth   = inject(AuthService);
  http   = inject(HttpClient);

  menuOpen         = signal(false);
  userMenuOpen     = signal(false);
  notifOpen        = signal(false);
  anomalias        = signal<Anomalia[]>([]);
  lastSeenId       = signal<number>(parseInt(localStorage.getItem('lastSeenAnomaliaId') || '0', 10));
  notifCount       = computed(() => this.anomalias().filter(a => a.id > this.lastSeenId()).length);
  hasNotifications = computed(() => this.notifCount() > 0);

  user    = computed(() => this.auth.currentUser());
  isAdmin = computed(() => this.auth.isAdmin());

  private pollInterval?: ReturnType<typeof setInterval>;

  navItems: NavItem[] = [
    { label: 'Panel de Aulas', route: '/home',     icon: 'grid_view'             },
    { label: 'Personal',       route: '/personal', icon: 'badge',  adminOnly: true },
    { label: 'Materias',       route: '/materias', icon: 'menu_book'             },
    { label: 'Grupos',         route: '/grupos',   icon: 'groups'                },
  ];

  visibleNav = computed(() =>
    this.navItems.filter(i => !i.adminOnly || this.isAdmin())
  );

  ngOnInit(): void {
    this.fetchAnomalias();
    // Polling cada 30 s — reemplazar por WebSocket cuando esté disponible
    this.pollInterval = setInterval(() => this.fetchAnomalias(), 30_000);
  }

  ngOnDestroy(): void {
    clearInterval(this.pollInterval);
  }

  private fetchAnomalias(): void {
    const token = this.auth.getToken?.() ?? localStorage.getItem('token') ?? '';
    this.http
      .get<Anomalia[]>(`${environment.apiUrl}/aulas/anomalias`, {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      })
      .subscribe({
        next:  data  => this.anomalias.set(data),
        error: err   => console.warn('⚠️ No se pudieron cargar las anomalías:', err.message),
      });
  }

  // ── Labels & time helpers ───────────────────────────────────────────────────
  motivoLabel(motivo: string): string {
    return MOTIVO_LABELS[motivo] ?? motivo;
  }

  timeAgo(isoString: string): string {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60)                return 'Hace un momento';
    if (diff < 3600)              return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400)             return `Hace ${Math.floor(diff / 3600)} h`;
    return                               `Hace ${Math.floor(diff / 86400)} días`;
  }

  // ── Toggle handlers ─────────────────────────────────────────────────────────
  toggleMenu():     void { this.menuOpen.update(v => !v);     this.userMenuOpen.set(false); this.notifOpen.set(false); }
  toggleUserMenu(): void { this.userMenuOpen.update(v => !v); this.menuOpen.set(false);     this.notifOpen.set(false); }
  toggleNotif(): void { 
    this.notifOpen.update(v => !v);    
    this.menuOpen.set(false);     
    this.userMenuOpen.set(false); 

    if (this.notifOpen() && this.anomalias().length > 0) {
      const maxId = Math.max(...this.anomalias().map(a => a.id));
      this.lastSeenId.set(maxId);
      localStorage.setItem('lastSeenAnomaliaId', maxId.toString());
    }
  }
  closeAll():       void { this.menuOpen.set(false); this.userMenuOpen.set(false); this.notifOpen.set(false); }

  logout(): void { this.auth.logout(); this.closeAll(); }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    const t = e.target as HTMLElement;
    if (
      !t.closest('.header-nav-wrapper') &&
      !t.closest('.user-menu-wrapper')  &&
      !t.closest('.notif-wrapper')
    ) {
      this.closeAll();
    }
  }
}
