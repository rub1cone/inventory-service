// Данные для обновления товара (все поля необязательные)
export class UpdateProductDto {
    name?: string;
    description?: string;
    sku?: string;
    current_quantity?: number;
    min_quantity?: number;
    price?: number;
  }