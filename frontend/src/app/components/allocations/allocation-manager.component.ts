import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AssemblyLineService } from '../../services/assembly-line.service';
import { WorkstationService } from '../../services/workstation.service';
import { AllocationService } from '../../services/allocation.service';
import { AssemblyLine, Workstation, Allocation } from '../../models';

@Component({
  selector: 'app-allocation-manager',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DragDropModule,
    MatCardModule, MatFormFieldModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatListModule,
    MatDividerModule, MatSnackBarModule, MatTooltipModule, MatProgressSpinnerModule
  ],
  templateUrl: './allocation-manager.component.html',
  styleUrl: './allocation-manager.component.css'
})
export class AllocationManagerComponent implements OnInit {
  private assemblyLineService = inject(AssemblyLineService);
  private workstationService = inject(WorkstationService);
  private allocationService = inject(AllocationService);
  private snackBar = inject(MatSnackBar);

  assemblyLines: AssemblyLine[] = [];
  allWorkstations: Workstation[] = [];
  selectedLineId: number | null = null;
  selectedLine: AssemblyLine | null = null;

  allocations: Allocation[] = [];
  availableWorkstations: Workstation[] = [];
  loading = false;

  ngOnInit(): void {
    this.assemblyLineService.getAll().subscribe(lines => this.assemblyLines = lines);
    this.workstationService.getAll().subscribe(ws => this.allWorkstations = ws);
  }

  onLineChange(): void {
    if (!this.selectedLineId) {
      this.selectedLine = null;
      this.allocations = [];
      this.availableWorkstations = [];
      return;
    }
    this.loadAllocations();
  }

  loadAllocations(): void {
    if (!this.selectedLineId) return;
    this.loading = true;

    this.selectedLine = this.assemblyLines.find(l => l.id === this.selectedLineId) || null;

    this.allocationService.getAllocations(this.selectedLineId).subscribe({
      next: (allocs) => {
        this.allocations = allocs;
        this.updateAvailable();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load allocations', 'OK', { duration: 3000 });
      }
    });
  }

  updateAvailable(): void {
    const allocatedIds = new Set(this.allocations.map(a => a.workstationId));
    this.availableWorkstations = this.allWorkstations.filter(ws => !allocatedIds.has(ws.id));
  }

  onDrop(event: CdkDragDrop<Allocation[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    moveItemInArray(this.allocations, event.previousIndex, event.currentIndex);

    const workstationIds = this.allocations.map(a => a.workstationId);
    this.allocationService.reorderAllocations(this.selectedLineId!, workstationIds).subscribe({
      next: (updated) => {
        this.allocations = updated;
        this.snackBar.open('Order updated', 'OK', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Failed to reorder', 'OK', { duration: 3000 });
        this.loadAllocations();
      }
    });
  }

  addWorkstation(ws: Workstation): void {
    if (!this.selectedLineId) return;
    this.allocationService.addAllocation(this.selectedLineId, ws.id).subscribe({
      next: () => {
        this.snackBar.open(`${ws.name} allocated`, 'OK', { duration: 2000 });
        this.loadAllocations();
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Failed to add', 'OK', { duration: 3000 });
      }
    });
  }

  removeAllocation(alloc: Allocation): void {
    if (!this.selectedLineId) return;
    this.allocationService.removeAllocation(this.selectedLineId, alloc.workstationId).subscribe({
      next: () => {
        this.snackBar.open('Allocation removed', 'OK', { duration: 2000 });
        this.loadAllocations();
      },
      error: () => {
        this.snackBar.open('Failed to remove', 'OK', { duration: 3000 });
      }
    });
  }
}
