import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AssemblyLineService } from '../../services/assembly-line.service';
import { AssemblyLine, Product } from '../../models';

@Component({
  selector: 'app-assembly-line-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSlideToggleModule, MatButtonModule, MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.line ? 'Edit Assembly Line' : 'New Assembly Line' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-fields">
        <mat-form-field appearance="fill">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Convey line">
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Product</mat-label>
          <mat-select formControlName="productId">
            @for (p of data.products; track p.id) {
              <mat-option [value]="p.id">{{ p.name }}</mat-option>
            }
          </mat-select>
          @if (form.get('productId')?.hasError('required') && form.get('productId')?.touched) {
            <mat-error>Product is required</mat-error>
          }
        </mat-form-field>

        <mat-slide-toggle formControlName="active" color="primary">Active</mat-slide-toggle>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || saving" (click)="save()">
        {{ saving ? 'Saving...' : (data.line ? 'Update' : 'Create') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.form-fields { display: flex; flex-direction: column; gap: 8px; min-width: 360px; }`]
})
export class AssemblyLineFormDialogComponent {
  private fb = inject(FormBuilder);
  private service = inject(AssemblyLineService);
  private snackBar = inject(MatSnackBar);

  form: FormGroup;
  saving = false;

  constructor(
    public dialogRef: MatDialogRef<AssemblyLineFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { line: AssemblyLine | null; products: Product[] }
  ) {
    this.form = this.fb.group({
      name: [data.line?.name || '', [Validators.required]],
      productId: [data.line?.productId || null, [Validators.required]],
      active: [data.line?.active ?? true]
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const obs = this.data.line
      ? this.service.update(this.data.line.id, this.form.value)
      : this.service.create(this.form.value);
    obs.subscribe({
      next: () => {
        this.snackBar.open(this.data.line ? 'Assembly line updated' : 'Assembly line created', 'OK', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err.error?.error || 'Save failed', 'OK', { duration: 3000 });
      }
    });
  }
}
