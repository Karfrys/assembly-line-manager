import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models';
import { ProductFormDialogComponent } from './product-form-dialog.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatDialogModule, MatSnackBarModule, MatTooltipModule
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchQuery = '';
  displayedColumns = ['name', 'assemblyLines', 'actions'];

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getAll().subscribe(products => {
      this.products = products;
      this.applyFilter();
    });
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredProducts = this.products.filter(p => p.name.toLowerCase().includes(q));
  }

  openCreate(): void {
    const ref = this.dialog.open(ProductFormDialogComponent, {
      width: '440px',
      data: null,
      panelClass: 'dark-dialog'
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadProducts();
    });
  }

  openEdit(product: Product): void {
    const ref = this.dialog.open(ProductFormDialogComponent, {
      width: '440px',
      data: product,
      panelClass: 'dark-dialog'
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadProducts();
    });
  }

  delete(product: Product): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Delete Product', message: `Are you sure you want to delete "${product.name}"? This will also delete all associated assembly lines.` },
      panelClass: 'dark-dialog'
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.productService.delete(product.id).subscribe({
          next: () => {
            this.snackBar.open('Product deleted', 'OK', { duration: 3000 });
            this.loadProducts();
          },
          error: () => this.snackBar.open('Failed to delete product', 'OK', { duration: 3000 })
        });
      }
    });
  }
}
