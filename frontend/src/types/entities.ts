// src/types/entities.ts
export interface Client {
  id: number;
  name: string;
  phone?: string | null;
  address?: string | null;
}

export interface Product {
  id: number;
  name: string;
}

export interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: Product;
}

export interface OrderUser { // Funcionário
  name: string | null;
  email: string;
}

// Interface para a lista principal de pedidos (GET /orders)
export interface OrderSummary {
  id: number;
  createdAt: string;
  status: string;
  total: number;
  user: OrderUser;
  client: Client | null;
  deliveryDate?: string | null;
  items: { id: number }[];
}


// Interface para os detalhes completos de um pedido (GET /orders/:id)
export interface FullOrder {
  id: number;
  status: string;
  total: number;
  observations?: string | null;
  deliveryDate?: string | null;
  createdAt: string;
  client?: Client | null;
  items: OrderItem[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER'; // <--- Adicione
}