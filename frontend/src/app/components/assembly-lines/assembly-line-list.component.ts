import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AssemblyLineService } from '../../services/assembly-line.service';
import { ProductService } from '../../services/product.service';
import { AssemblyLine, Product } from '../../models';
import { AssemblyLineFormDialogComponent } from './assembly-line-form-dialog.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';

@Component({
  selector: 'app-assembly-line-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule,
    MatChipsModule, MatDialogModule, MatSnackBarModule, MatTooltipModule
  ],
  templateUrl: './assembly-line-list.component.html',
  styleUrl: './assembly-line-list.component.css'
})
export class AssemblyLineListComponent implements OnInit {
  private assemblyLineService = inject(AssemblyLineService);
  private productService = inject(ProductService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  lines: AssemblyLine[] = [];
  filteredLines: AssemblyLine[] = [];
  products: Product[] = [];
  selectedProductId: number | null = null;
  displayedColumns = ['name', 'product', 'active', 'workstations', 'actions'];

  ngOnInit(): void {
    this.productService.getAll().subscribe(p => this.products = p);
    this.loadLines();
  }

  loadLines(): void {
    const productId = this.selectedProductId || undefined;
    this.assemblyLineService.getAll(productId).subscribe(lines => {
      this.lines = lines;
      this.filteredLines = lines;
    });
  }

  onFilterChange(): void {
    this.loadLines();
  }

  toggleActive(line: AssemblyLine): void {
    this.assemblyLineService.update(line.id, { active: !line.active }).subscribe({
      next: (updated) => {
        line.active = updated.active;
        this.snackBar.open(`Line ${updated.active ? 'activated' : 'deactivated'}`, 'OK', { duration: 2000 });
      },
      error: () => this.snackBar.open('Failed to update', 'OK', { duration: 3000 })
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(AssemblyLineFormDialogComponent, {
      width: '480px',
      data: { line: null, products: this.products },
      panelClass: 'dark-dialog'
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadLines(); });
  }

  openEdit(line: AssemblyLine): void {
    const ref = this.dialog.open(AssemblyLineFormDialogComponent, {
      width: '480px',
      data: { line, products: this.products },
      panelClass: 'dark-dialog'
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadLines(); });
  }

  delete(line: AssemblyLine): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Delete Assembly Line', message: `Delete "${line.name}"? All allocations will be removed.` },
      panelClass: 'dark-dialog'
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.assemblyLineService.delete(line.id).subscribe({
          next: () => {
            this.snackBar.open('Assembly line deleted', 'OK', { duration: 3000 });
            this.loadLines();
          },
          error: () => this.snackBar.open('Failed to delete', 'OK', { duration: 3000 })
        });
      }
    });
  }
}
