import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AssemblyLine } from '../models';

const API_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class AssemblyLineService {
  private http = inject(HttpClient);

  getAll(productId?: number): Observable<AssemblyLine[]> {
    let params = new HttpParams();
    if (productId) {
      params = params.set('productId', productId.toString());
    }
    return this.http.get<AssemblyLine[]>(`${API_URL}/assembly-lines`, { params });
  }

  getById(id: number): Observable<AssemblyLine> {
    return this.http.get<AssemblyLine>(`${API_URL}/assembly-lines/${id}`);
  }

  create(data: Partial<AssemblyLine>): Observable<AssemblyLine> {
    return this.http.post<AssemblyLine>(`${API_URL}/assembly-lines`, data);
  }

  update(id: number, data: Partial<AssemblyLine>): Observable<AssemblyLine> {
    return this.http.put<AssemblyLine>(`${API_URL}/assembly-lines/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/assembly-lines/${id}`);
  }
}
