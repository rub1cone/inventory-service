// Данные для создания операции (приход или убыль)
export class CreateTransactionDto {
    product_id: number;
    quantity: number;
    transaction_date: string; // Формат: 'YYYY-MM-DD'
    comment?: string;
  }