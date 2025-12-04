# 🍰 Dashboard de Confeitaria

Um sistema completo para gerenciamento de uma confeitaria, permitindo o controle de **clientes**, **pedidos**, **produtos** e **autenticação**.  
O projeto é composto por um **backend em NestJS + Prisma** e um **frontend em Vite + TypeScript**.

---

## 🚀 Tecnologias Utilizadas

### **Backend**
- **NestJS** — Framework Node.js modular e escalável.
- **Prisma ORM** — Mapeamento de banco de dados moderno e rápido.
- **Supabase** — Bando de dados relacional
- **PostgreSQL** (ou outro banco configurado no `schema.prisma`)
- **JWT** — Autenticação segura baseada em tokens.
- **BCrypt** — Criptografia de senhas.

### **Frontend**
- **Vite** — Bundler extremamente rápido.
- **TypeScript**
- **Axios** — Comunicação com o backend.
- **React Query** (opcional) — Gerenciamento de estados assíncronos.
- **React Router** — Navegação entre telas.

---

## 📦 Funcionalidades

### 👤 **Autenticação**
- Registro de novos usuários.
- Login com e-mail e senha.
- Armazenamento seguro do token JWT.
- Rota protegida no frontend e backend.

### 🧁 **Produtos**
- Cadastro de produtos da confeitaria (nome, preço, descrição, categoria, imagem).
- Listagem com paginação.
- Edição e remoção.
- Controle de estoque opcional.

### 🧾 **Pedidos**
- Criar pedidos vinculados a um cliente.
- Adicionar múltiplos produtos ao pedido.
- Cálculo automático do valor total.
- Atualizar status do pedido (ex: *pendente*, *em preparo*, *pronto*, *entregue*).
- Histórico completo de pedidos.

### 🧍 **Clientes**
- Cadastro de clientes (nome, telefone, endereço).
- Lista de clientes com filtros.
- Visualização rápida dos pedidos feitos por cada cliente.

### 👳 **Kanban de Produção**
- Tela de alteração de pedido de forma veloz.
- Lista os pedidos em "A Fazer 📋", "No Forno 🔥", "Pronto 🎁" e "Entregue ✅".

### 🗓️ **Calendário**
- Data e horário de entrega

### 💵 **Reporte Mensal**
- Funcionalidade que traz um reporte mensal de pedidos, lucro, despesas e a média entre os períodos

### 🔎 **Auditoria**
- Registra o que cada funcionário fez.
- Registra "Delete", "Update", "Create"

---
