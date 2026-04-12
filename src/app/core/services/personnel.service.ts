// src/app/core/services/personnel.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { Personnel } from '../models/personnel.model';
import { environment } from '../config/environment';

const MOCK_PERSONNEL: Personnel[] = [
  { id: 'p1', firstName: 'Laura',    lastName: 'Sánchez', email: 'l.sanchez@escuela.edu', phone: '442-100-0001', role: 'teacher',  department: 'Matemáticas', status: 'active', createdAt: '2023-01-15', avatarInitials: 'LS' },
  { id: 'p2', firstName: 'Patricia', lastName: 'Herrera', email: 'p.herrera@escuela.edu', phone: '442-100-0010', role: 'director', department: 'Dirección',  status: 'active', createdAt: '2018-07-15', avatarInitials: 'PH' },
  { id: 'p3', firstName: 'Elena',    lastName: 'Ramírez', email: 'e.ramirez@escuela.edu', phone: '442-100-0020', role: 'cleaning', status: 'active', createdAt: '2022-11-01', avatarInitials: 'ER' },
];

// Maps DB row (usuario) → Personnel frontend model
function mapUsuario(u: any): Personnel {
  const parts = (u.nombre || '').split(' ');
  const firstName = parts[0] || '';
  const lastName  = parts.slice(1).join(' ') || '';
  const initials  = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  // Map rol_id: 1=admin→director, 2=usuario→teacher, others→cleaning
  const roleMap: Record<number, Personnel['role']> = { 1: 'director', 2: 'teacher' };
  const role: Personnel['role'] = roleMap[u.rol_id] ?? 'cleaning';
  return {
    id:             String(u.id),
    firstName,
    lastName,
    email:          u.email,
    phone:          u.telefono || '',
    role,
    department:     u.departamento || '',
    status:         u.activo ? 'active' : 'inactive',
    createdAt:      u.creado_en ? u.creado_en.split('T')[0] : '',
    avatarInitials: initials || '??',
  };
}

@Injectable({ providedIn: 'root' })
export class PersonnelService {
  private readonly USE_MOCK = false;
  private readonly API_URL = `${environment.apiUrl}/usuarios`;
  private mockData = [...MOCK_PERSONNEL];

  personnel = signal<Personnel[]>([...this.mockData]);

  constructor(private http: HttpClient) {}

  getAll(): Observable<Personnel[]> {
    if (this.USE_MOCK) return of([...this.mockData]).pipe(delay(300));
    console.log('📥 GET', this.API_URL);
    return this.http.get<any[]>(this.API_URL).pipe(
      tap(data => console.log('✅ Respuesta GET:', data)),
      map(list => list.map(mapUsuario)),
      tap(data => this.personnel.set(data))
    );
  }

  create(data: Omit<Personnel, 'id' | 'createdAt'> & { password?: string }): Observable<Personnel> {
    if (this.USE_MOCK) {
      const newItem: Personnel = { ...data, id: `p${Date.now()}`, createdAt: new Date().toISOString().split('T')[0], avatarInitials: `${data.firstName[0]}${data.lastName[0]}`.toUpperCase() };
      this.mockData = [...this.mockData, newItem];
      this.personnel.set([...this.mockData]);
      return of(newItem).pipe(delay(400));
    }
    // Map frontend → backend payload
    const rolMap: Record<string, number> = { director: 1, teacher: 2, coordinator: 2, cleaning: 2, admin: 1 };
const payload = {
      nombre:  `${data.firstName} ${data.lastName}`.trim(),
      email:   data.email,
      password: data.password || 'MagicDoors2024!',
      rol_id:  rolMap[data.role] ?? 2,
      telefono: data.phone,           
      departamento: data.department   
    };
    console.log('📤 POST /registro con payload:', payload);
    return this.http.post<any>(`${this.API_URL}/registro`, payload).pipe(
      map(mapUsuario),
      tap(item => {
        console.log('✅ Respuesta /registro:', item);
        this.personnel.update(list => [...list, item]);
      })
    );
  }

  update(id: string, data: Partial<Personnel>): Observable<Personnel> {
    if (this.USE_MOCK) {
      this.mockData = this.mockData.map(p => p.id === id ? { ...p, ...data } : p);
      this.personnel.set([...this.mockData]);
      return of(this.mockData.find(p => p.id === id)!).pipe(delay(400));
    }
    const rolMap: Record<string, number> = { director: 1, teacher: 2, coordinator: 2, cleaning: 2, admin: 1 };
const payload: any = {
      nombre: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}`.trim() : undefined,
      email:  data.email,
      rol_id: data.role ? rolMap[data.role] : undefined,
      activo: data.status === 'active',
      telefono: data.phone,           
      departamento: data.department   
    };
    return this.http.put<any>(`${this.API_URL}/${id}`, payload).pipe(
      map(mapUsuario),
      tap(updated => this.personnel.update(list => list.map(p => p.id === id ? updated : p)))
    );
  }

  delete(id: string): Observable<void> {
    if (this.USE_MOCK) {
      this.mockData = this.mockData.filter(p => p.id !== id);
      this.personnel.set([...this.mockData]);
      return of(undefined).pipe(delay(300));
    }
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => this.personnel.update(list => list.map(p => p.id === id ? { ...p, status: 'inactive' } : p)))
    );
  }
}