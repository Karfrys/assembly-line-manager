import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Workstation } from '../models';

const API_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class WorkstationService {
  private http = inject(HttpClient);

  getAll(): Observable<Workstation[]> {
    return this.http.get<Workstation[]>(`${API_URL}/workstations`);
  }

  getById(id: number): Observable<Workstation> {
    return this.http.get<Workstation>(`${API_URL}/workstations/${id}`);
  }

  create(data: Partial<Workstation>): Observable<Workstation> {
    return this.http.post<Workstation>(`${API_URL}/workstations`, data);
  }

  update(id: number, data: Partial<Workstation>): Observable<Workstation> {
    return this.http.put<Workstation>(`${API_URL}/workstations/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/workstations/${id}`);
  }
}
