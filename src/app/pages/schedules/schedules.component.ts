// src/app/pages/schedules/schedules.component.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../core/config/environment';

export interface Sesion {
  id:             number;
  aulaId:         string;
  aulaNombre:     string;
  profesorId:     string;
  profesorNombre: string;
  materiaId:      string;
  materiaNombre:  string;
  materiaCodigo:  string;
  grupoId:        string;
  grupoNombre:    string;
  horaInicio:     string;
  horaFin:        string;
  diasSemana:     string;  // "1,3,5"
  activa:         boolean;
}

// Mapeo canónico de número → nombre completo y abreviatura
const DIA_MAP: Record<string, { nombre: string; abrev: string }> = {
  '1': { nombre: 'Lunes',     abrev: 'Lu' },
  '2': { nombre: 'Martes',    abrev: 'Ma' },
  '3': { nombre: 'Miércoles', abrev: 'Mi' },
  '4': { nombre: 'Jueves',    abrev: 'Ju' },
  '5': { nombre: 'Viernes',   abrev: 'Vi' },
  '6': { nombre: 'Sábado',    abrev: 'Sá' },
};

// Orden canónico para ordenar chips
const DIA_ORDER = ['1', '2', '3', '4', '5', '6'];

@Component({
  selector:    'app-schedules',
  standalone:  true,
  imports:     [FormsModule],
  templateUrl: './schedules.component.html',
  styleUrl:    './schedules.component.scss',
})
export class SchedulesComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  // ── Data ────────────────────────────────────────────────────────────────────
  sesiones = signal<Sesion[]>([]);
  loading  = signal(true);
  error    = signal<string | null>(null);

  // ── Filtros reactivos ────────────────────────────────────────────────────────
  filtroDocente = signal('');
  filtroAula    = signal('');
  filtroGrupo   = signal('');
  filtroDia     = signal('');   // '1'–'6' | ''

  // ── Opciones únicas para los selects (derivadas de los datos) ────────────────
  aulasUnicas  = computed(() => [...new Set(this.sesiones().map(s => s.aulaNombre))].sort());
  gruposUnicos = computed(() => [...new Set(this.sesiones().map(s => s.grupoNombre))].sort());

  readonly diasOpciones = DIA_ORDER.map(d => ({
    valor:  d,
    nombre: DIA_MAP[d].nombre,
  }));

  // ── Tabla filtrada (computed signal — reactiva sin subscriptions manuales) ───
  sesionesFiltered = computed(() => {
    const docente = this.filtroDocente().toLowerCase().trim();
    const aula    = this.filtroAula();
    const grupo   = this.filtroGrupo();
    const dia     = this.filtroDia();

    return this.sesiones().filter(s => {
      if (docente && !s.profesorNombre.toLowerCase().includes(docente)) return false;
      if (aula    && s.aulaNombre  !== aula)                            return false;
      if (grupo   && s.grupoNombre !== grupo)                           return false;
      if (dia     && !s.diasSemana.split(',').map(d => d.trim()).includes(dia)) return false;
      return true;
    });
  });

  totalActivas   = computed(() => this.sesiones().filter(s => s.activa).length);
  totalInactivas = computed(() => this.sesiones().filter(s => !s.activa).length);

  ngOnInit(): void {
    this.fetchSesiones();
  }

  fetchSesiones(): void {
    const token = this.auth.getToken?.() ?? localStorage.getItem('token') ?? '';
    this.http
      .get<Sesion[]>(`${environment.apiUrl}/aulas/sesiones/todas`, {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      })
      .subscribe({
        next:  data  => { this.sesiones.set(data); this.loading.set(false); },
        error: err   => {
          this.error.set(err.error?.error ?? 'No se pudieron cargar las sesiones');
          this.loading.set(false);
        },
      });
  }

  clearFilters(): void {
    this.filtroDocente.set('');
    this.filtroAula.set('');
    this.filtroGrupo.set('');
    this.filtroDia.set('');
  }

  hasActiveFilters = computed(() =>
    !!(this.filtroDocente() || this.filtroAula() || this.filtroGrupo() || this.filtroDia())
  );

  // ── Helpers de días ──────────────────────────────────────────────────────────

  /** Convierte "1,3,5" → array ordenado de claves ['1','3','5'] */
  parseDias(diasStr: string): string[] {
    return diasStr
      .split(',')
      .map(d => d.trim())
      .filter(d => DIA_MAP[d])
      .sort((a, b) => DIA_ORDER.indexOf(a) - DIA_ORDER.indexOf(b));
  }

  /** Devuelve la abreviatura de un día: '1' → 'Lu' */
  diaAbrev(d: string): string {
    return DIA_MAP[d]?.abrev ?? d;
  }

  /** Devuelve el nombre completo: '1' → 'Lunes' */
  diaNombre(d: string): string {
    return DIA_MAP[d]?.nombre ?? d;
  }

  /** Texto accesible completo: "1,3,5" → "Lunes, Miércoles, Viernes" */
  diasTexto(diasStr: string): string {
    return this.parseDias(diasStr).map(d => this.diaNombre(d)).join(', ');
  }
}