// Данные для создания операции (приход или убыль)
export class CreateTransactionDto {
    product_id: number;
    quantity: number;
    transaction_date: string; 
    comment?: string;
  }