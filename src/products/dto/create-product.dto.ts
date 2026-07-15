export class CreateProductDto {
    name: string;
    description?: string;
    sku: string;
    current_quantity?: number;
    min_quantity?: number;
    price: number;
  }