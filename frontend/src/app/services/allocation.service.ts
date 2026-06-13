import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Allocation } from '../models';

const API_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class AllocationService {
  private http = inject(HttpClient);

  getAllocations(assemblyLineId: number): Observable<Allocation[]> {
    return this.http.get<Allocation[]>(`${API_URL}/assembly-lines/${assemblyLineId}/allocations`);
  }

  addAllocation(assemblyLineId: number, workstationId: number): Observable<Allocation> {
    return this.http.post<Allocation>(`${API_URL}/assembly-lines/${assemblyLineId}/allocations`, { workstationId });
  }

  removeAllocation(assemblyLineId: number, workstationId: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/assembly-lines/${assemblyLineId}/allocations/${workstationId}`);
  }

  reorderAllocations(assemblyLineId: number, workstationIds: number[]): Observable<Allocation[]> {
    return this.http.put<Allocation[]>(`${API_URL}/assembly-lines/${assemblyLineId}/allocations/reorder`, { workstationIds });
  }
}
