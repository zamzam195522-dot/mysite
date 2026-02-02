export type Id = string;

export type Product = {
  id: Id;
  name: string;
  categoryId?: Id | null;
  bottleType?: string | null;
  isReturnable: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  defaultPrice?: number | null;
};

export type ProductCategory = {
  id: Id;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
};

export type Customer = {
  id: Id;
  code: string;
  name: string;
  contact?: string | null;
  address?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
};

export type Employee = {
  id: Id;
  code: string;
  name: string;
  contact?: string | null;
  designation: 'SALESMAN' | 'DRIVER' | 'OFFICE_STAFF' | 'OTHER';
  status: 'ACTIVE' | 'INACTIVE';
};

