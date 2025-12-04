// src/pages/KanbanPage.tsx
import { Box, Typography, Paper, Chip, IconButton } from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { OrderSummary } from '../types/entities';
import { Eye } from 'lucide-react';
import { OrderDetailsModal } from '../components/OrderDetailsModal';

// Mapeamento de Status para Títulos das Colunas
const COLUMNS = {
  PENDENTE: { title: 'A Fazer 📋', color: '#f5f5f5', border: '#d1d5db' },
  EM_PREPARO: { title: 'No Forno 🔥', color: '#fff7ed', border: '#fdba74' },
  PRONTO: { title: 'Pronto / Embalagem 🎁', color: '#f0fdf4', border: '#86efac' },
  CONCLUÍDO: { title: 'Entregue ✅', color: '#eff6ff', border: '#93c5fd' },
  SINAL_PAGO: { title: 'Sinal Pago 💵', color: '#f0fdf4', border: '#03b444ff'}
};

// Ordem das colunas
const COLUMN_ORDER = ['PENDENTE', 'EM_PREPARO', 'PRONTO', 'CONCLUÍDO'];

export function KanbanPage() {
  // Estado que agrupa pedidos por status: { PENDENTE: [...], EM_PREPARO: [...] }
  const [columns, setColumns] = useState<Record<string, OrderSummary[]>>({});
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Função para buscar e organizar os pedidos
  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.get<OrderSummary[]>('/orders');
      const allOrders = response.data;

      // Inicializa as colunas vazias
      const newColumns: Record<string, OrderSummary[]> = {
        PENDENTE: [],
        EM_PREPARO: [],
        PRONTO: [],
        CONCLUÍDO: []
      };

      // Distribui os pedidos nas colunas (Ignora CANCELADO no Kanban)
      allOrders.forEach(order => {
        if (newColumns[order.status]) {
          newColumns[order.status].push(order);
        }
      });

      setColumns(newColumns);
    } catch (error) {
      console.error("Erro ao carregar Kanban:", error);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Lógica executada ao soltar um card
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Se soltou fora ou no mesmo lugar, não faz nada
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // 1. Atualização Otimista (Visual)
    const startCol = source.droppableId;
    const endCol = destination.droppableId;
    
    // Copia do estado atual
    const newColumns = { ...columns };
    
    // Remove da coluna de origem
    const [movedOrder] = newColumns[startCol].splice(source.index, 1);
    
    // Atualiza o status do objeto movido
    movedOrder.status = endCol;
    
    // Adiciona na coluna de destino
    newColumns[endCol].splice(destination.index, 0, movedOrder);
    
    setColumns(newColumns);

    // 2. Atualização no Backend
    try {
      await api.patch(`/orders/${draggableId}`, { status: endCol });
    } catch (error) {
      console.error("Erro ao mover card:", error);
      // Se der erro, recarrega para desfazer a mudança visual
      fetchOrders();
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
        Quadro de Produção
      </Typography>

      {/* Área de Drag and Drop */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          overflowX: 'auto', 
          pb: 2, 
          flexGrow: 1 
        }}>
          {COLUMN_ORDER.map(columnId => {
            const columnData = COLUMNS[columnId as keyof typeof COLUMNS];
            const ordersInColumn = columns[columnId] || [];

            return (
              <Box 
                key={columnId}
                sx={{ 
                  minWidth: 280, 
                  width: 320,
                  display: 'flex', 
                  flexDirection: 'column' 
                }}
              >
                {/* Cabeçalho da Coluna */}
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    mb: 2, 
                    backgroundColor: columnData.color, 
                    borderTop: `4px solid ${columnData.border}`,
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  {columnData.title}
                  <Chip label={ordersInColumn.length} size="small" sx={{ bgcolor: 'white', fontWeight: 'bold' }} />
                </Paper>

                {/* Área "Soltável" */}
                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        flexGrow: 1,
                        backgroundColor: snapshot.isDraggingOver ? '#f3f4f6' : 'transparent',
                        borderRadius: 2,
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      {ordersInColumn.map((order, index) => (
                        <Draggable key={order.id} draggableId={String(order.id)} index={index}>
                          {(provided, snapshot) => (
                            <Paper
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              elevation={snapshot.isDragging ? 4 : 0}
                              sx={{
                                p: 2,
                                mb: 2,
                                border: '1px solid #e0e0e0',
                                borderRadius: 2,
                                backgroundColor: 'white',
                                transition: 'transform 0.2s',
                                ...provided.draggableProps.style
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  #{order.id} - {order.client?.name || 'Balcão'}
                                </Typography>
                                <IconButton size="small" onClick={() => setSelectedOrderId(order.id)}>
                                  <Eye size={16} />
                                </IconButton>
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {order.items.length} Itens • R$ {Number(order.total).toFixed(2)}
                            </Typography>

                              {order.deliveryDate && (
                                <Chip 
                                  label={new Date(order.deliveryDate).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'})} 
                                  size="small" 
                                  color={new Date(order.deliveryDate) < new Date() ? "error" : "default"}
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              )}
                            </Paper>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Box>
            );
          })}
        </Box>
      </DragDropContext>

      <OrderDetailsModal
        open={selectedOrderId !== null}
        handleClose={() => setSelectedOrderId(null)}
        orderId={selectedOrderId}
      />
    </Box>
  );
}