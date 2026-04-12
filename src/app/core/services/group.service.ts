import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Group } from '../models/group.model';
import { environment } from '../config/environment';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private readonly API_URL = `${environment.apiUrl}/grupos`;

  // Signal global
  groups = signal<Group[]>([]);

  constructor(private http: HttpClient) {}

  getAll(): Observable<Group[]> {
    return this.http.get<Group[]>(this.API_URL).pipe(tap(d => this.groups.set(d)));
  }

  create(data: Omit<Group, 'id'>): Observable<Group> {
    return this.http.post<Group>(this.API_URL, data).pipe(
      tap(item => this.groups.update(l => [item, ...l]))
    );
  }

  update(id: string, data: Partial<Group>): Observable<Group> {
    return this.http.put<Group>(`${this.API_URL}/${id}`, data).pipe(
      tap(u => this.groups.update(l => l.map(g => g.id === id ? u : g)))
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => this.groups.update(l => l.map(g => g.id === id ? { ...g, status: 'inactive' } : g)))
    );
  }
}