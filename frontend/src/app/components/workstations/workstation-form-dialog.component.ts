import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WorkstationService } from '../../services/workstation.service';
import { Workstation } from '../../models';

@Component({
  selector: 'app-workstation-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSnackBarModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit Workstation' : 'New Workstation' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-fields">
        <mat-form-field appearance="fill">
          <mat-label>Short Name (Code)</mat-label>
          <input matInput formControlName="shortName" placeholder="e.g. LW">
          @if (form.get('shortName')?.hasError('required') && form.get('shortName')?.touched) {
            <mat-error>Short name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Full Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Laser welding">
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>PC Name</mat-label>
          <input matInput formControlName="pcName" placeholder="e.g. LASER-PC-01">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || saving" (click)="save()">
        {{ saving ? 'Saving...' : (data ? 'Update' : 'Create') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.form-fields { display: flex; flex-direction: column; gap: 8px; min-width: 360px; }`]
})
export class WorkstationFormDialogComponent {
  private fb = inject(FormBuilder);
  private service = inject(WorkstationService);
  private snackBar = inject(MatSnackBar);

  form: FormGroup;
  saving = false;

  constructor(
    public dialogRef: MatDialogRef<WorkstationFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Workstation | null
  ) {
    this.form = this.fb.group({
      shortName: [data?.shortName || '', [Validators.required]],
      name: [data?.name || '', [Validators.required]],
      pcName: [data?.pcName || '']
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const obs = this.data
      ? this.service.update(this.data.id, this.form.value)
      : this.service.create(this.form.value);
    obs.subscribe({
      next: () => {
        this.snackBar.open(this.data ? 'Workstation updated' : 'Workstation created', 'OK', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err.error?.error || 'Save failed', 'OK', { duration: 3000 });
      }
    });
  }
}
