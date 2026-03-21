import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Group } from '../models/group.model';
import { environment } from '../config/environment';

const MOCK_GROUPS: Group[] = [
  { id: 'g1', name: '1-A', grade: '1° Semestre', shift: 'morning',   studentCount: 32, tutorName: 'Lic. Roberto Flores', status: 'active' },
  { id: 'g2', name: '2-B', grade: '2° Semestre', shift: 'afternoon', studentCount: 28, tutorName: 'Mtra. Gabriela Ríos', status: 'active' },
  { id: 'g3', name: '3-A', grade: '3° Semestre', shift: 'morning',   studentCount: 27, tutorName: 'Dra. Laura Sánchez',  status: 'active' },
];

@Injectable({ providedIn: 'root' })
export class GroupService {
  private readonly USE_MOCK = false;
  private readonly API_URL = `${environment.apiUrl}/grupos`;
  private mockData = [...MOCK_GROUPS];

  groups = signal<Group[]>([...this.mockData]);

  constructor(private http: HttpClient) {}

  getAll(): Observable<Group[]> {
    if (this.USE_MOCK) return of([...this.mockData]).pipe(delay(300));
    return this.http.get<Group[]>(this.API_URL).pipe(tap(d => this.groups.set(d)));
  }

  create(data: Omit<Group, 'id'>): Observable<Group> {
    if (this.USE_MOCK) {
      const newItem = { ...data, id: `g${Date.now()}` };
      this.mockData = [...this.mockData, newItem];
      this.groups.set([...this.mockData]);
      return of(newItem).pipe(delay(400));
    }
    return this.http.post<Group>(this.API_URL, data).pipe(
      tap(item => this.groups.update(l => [...l, item]))
    );
  }

  update(id: string, data: Partial<Group>): Observable<Group> {
    if (this.USE_MOCK) {
      this.mockData = this.mockData.map(g => g.id === id ? { ...g, ...data } : g);
      this.groups.set([...this.mockData]);
      return of(this.mockData.find(g => g.id === id)!).pipe(delay(400));
    }
    return this.http.put<Group>(`${this.API_URL}/${id}`, data).pipe(
      tap(u => this.groups.update(l => l.map(g => g.id === id ? u : g)))
    );
  }

  delete(id: string): Observable<void> {
    if (this.USE_MOCK) {
      this.mockData = this.mockData.filter(g => g.id !== id);
      this.groups.set([...this.mockData]);
      return of(undefined).pipe(delay(300));
    }
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => this.groups.update(l => l.filter(g => g.id !== id)))
    );
  }
}
