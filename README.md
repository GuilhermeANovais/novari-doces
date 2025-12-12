# 🍰 Dashboard de Confeitaria

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Repo Size](https://img.shields.io/github/repo-size/GuilhermeANovais/heaven?style=flat-square)
![Last Commit](https://img.shields.io/github/last-commit/GuilhermeANovais/heaven?style=flat-square)
![Language](https://img.shields.io/github/languages/top/GuilhermeANovais/heaven?style=flat-square)
![Prisma](https://img.shields.io/badge/Prisma-6.19.0-2D3748?style=flat-square&logo=prisma&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)

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

## Melhorias
- [ ] PDV do Delivery
- [ ] App para Mobile (IOS e ANDROID)
- [ ] Feature Multi-Tenant
- [ ] API Whatsapp para mensagens automáticas

---

## 📝 Licença
Desenvolvido por [Guilherme Novais](https://github.com/GuilhermeANovais)

---

## Contatos
<a href="https://www.linkedin.com/in/guilherme-novais0/" target="_blank"><img loading="lazy" src="https://img.shields.io/badge/-LinkedIn-%230077B5?style=for-the-badge&logo=linkedin&logoColor=white" target="_blank"></a>
<a href="mailto:jose.guilherme.a.novais@gmail.com"> <img loading="lazy" src="https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white" target="_blank"></a>
<a href="https://www.instagram.com/guinwv"> <img loading="lazy" src="https://img.shields.io/badge/Instagram-%23E4405F.svg?style=for-the-badge&logo=Instagram&logoColor=white" target="_blank"></a> 
