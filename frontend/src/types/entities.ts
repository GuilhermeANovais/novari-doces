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
export type OrderSummary = {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  client: {
    name: string;
    phone: string;
  } | null;
  user: {
    name: string;
    email: string;
  };
  items: {
    quantity: number;
    price: number;
    product: {
      name: string;
    };
  }[];
};


// Interface para os detalhes completos de um pedido (GET /orders/:id)
export interface FullOrder {
  id: number;
  status: string;
  total: number;
  observations?: string | null;
  createdAt: string;
  client?: Client | null;
  items: OrderItem[];
}