import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ProductService } from '../../services/product.service';
import { AssemblyLineService } from '../../services/assembly-line.service';
import { WorkstationService } from '../../services/workstation.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private productService = inject(ProductService);
  private assemblyLineService = inject(AssemblyLineService);
  private workstationService = inject(WorkstationService);
  authService = inject(AuthService);

  stats = { products: 0, assemblyLines: 0, activeLines: 0, workstations: 0 };

  ngOnInit(): void {
    forkJoin({
      products: this.productService.getAll(),
      assemblyLines: this.assemblyLineService.getAll(),
      workstations: this.workstationService.getAll()
    }).subscribe(({ products, assemblyLines, workstations }) => {
      this.stats.products = products.length;
      this.stats.assemblyLines = assemblyLines.length;
      this.stats.activeLines = assemblyLines.filter(l => l.active).length;
      this.stats.workstations = workstations.length;
    });
  }
}
