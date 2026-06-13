export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  assemblyLines?: AssemblyLine[];
}

export interface AssemblyLine {
  id: number;
  name: string;
  active: boolean;
  productId: number;
  product?: Product;
  allocations?: Allocation[];
  createdAt: string;
  updatedAt: string;
}

export interface Workstation {
  id: number;
  shortName: string;
  name: string;
  pcName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Allocation {
  id: number;
  assemblyLineId: number;
  workstationId: number;
  sortOrder: number;
  workstation?: Workstation;
}

export interface AuthResponse {
  token: string;
  user: User;
}
