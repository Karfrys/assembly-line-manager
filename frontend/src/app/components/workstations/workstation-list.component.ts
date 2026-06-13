import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WorkstationService } from '../../services/workstation.service';
import { Workstation } from '../../models';
import { WorkstationFormDialogComponent } from './workstation-form-dialog.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';

@Component({
  selector: 'app-workstation-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatDialogModule, MatSnackBarModule, MatTooltipModule
  ],
  templateUrl: './workstation-list.component.html',
  styleUrl: './workstation-list.component.css'
})
export class WorkstationListComponent implements OnInit {
  private workstationService = inject(WorkstationService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  workstations: Workstation[] = [];
  filteredWorkstations: Workstation[] = [];
  searchQuery = '';
  displayedColumns = ['shortName', 'name', 'pcName', 'actions'];

  ngOnInit(): void {
    this.loadWorkstations();
  }

  loadWorkstations(): void {
    this.workstationService.getAll().subscribe(ws => {
      this.workstations = ws;
      this.applyFilter();
    });
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredWorkstations = this.workstations.filter(w =>
      w.name.toLowerCase().includes(q) ||
      w.shortName.toLowerCase().includes(q) ||
      w.pcName.toLowerCase().includes(q)
    );
  }

  openCreate(): void {
    const ref = this.dialog.open(WorkstationFormDialogComponent, {
      width: '480px',
      data: null,
      panelClass: 'dark-dialog'
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadWorkstations(); });
  }

  openEdit(ws: Workstation): void {
    const ref = this.dialog.open(WorkstationFormDialogComponent, {
      width: '480px',
      data: ws,
      panelClass: 'dark-dialog'
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadWorkstations(); });
  }

  delete(ws: Workstation): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Delete Workstation', message: `Delete "${ws.name}"? All allocations will be removed.` },
      panelClass: 'dark-dialog'
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.workstationService.delete(ws.id).subscribe({
          next: () => {
            this.snackBar.open('Workstation deleted', 'OK', { duration: 3000 });
            this.loadWorkstations();
          },
          error: () => this.snackBar.open('Failed to delete', 'OK', { duration: 3000 })
        });
      }
    });
  }
}
