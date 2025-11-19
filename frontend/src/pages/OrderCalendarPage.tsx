// src/pages/OrderCalendarPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, EventProps } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR'; // Idioma Português
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import api from '../api';
import { OrderSummary } from '../types/entities';
import { OrderDetailsModal } from '../components/OrderDetailsModal';

// 1. Configuração do Localizador (Data e Hora em PT-BR)
const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Interface interna para o Evento do Calendário
interface CalendarEvent {
  id: number; // ID do pedido
  title: string;
  start: Date;
  end: Date;
  status: string; // Para definir a cor
}

export function OrderCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para o Modal de Detalhes (Reutilizando o que já fizemos!)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<OrderSummary[]>('/orders');
      
      // 2. Transforma Pedidos em Eventos de Calendário
      const formattedEvents: CalendarEvent[] = response.data
        .filter(order => order.deliveryDate) // Só pega pedidos com data de entrega
        .map(order => {
          const startDate = new Date(order.deliveryDate!);
          // Define o fim como 1 hora depois (apenas para visualização no bloco)
          const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
          
          // Nome do Cliente ou Interno
          const clientName = order.client?.name || 'Interno';

          return {
            id: order.id,
            title: `#${order.id} - ${clientName}`,
            start: startDate,
            end: endDate,
            status: order.status
          };
        });

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Erro ao carregar calendário:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 3. Estilização Personalizada dos Eventos (Cores por Status)
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#1976d2'; // Azul padrão
    if (event.status === 'CONCLUÍDO') backgroundColor = '#2e7d32'; // Verde
    if (event.status === 'CANCELADO') backgroundColor = '#d32f2f'; // Vermelho
    if (event.status === 'PENDENTE') backgroundColor = '#ed6c02'; // Laranja

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  // 4. Ao clicar num evento, abre o modal
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedOrderId(event.id);
  };

  const handleCloseModal = () => {
    setSelectedOrderId(null);
    // Opcional: Recarregar dados ao fechar, caso tenha mudado algo no modal
    fetchOrders(); 
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom>
        Calendário de Entregas
      </Typography>

      <Paper elevation={3} sx={{ p: 2, flexGrow: 1, backgroundColor: 'white' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 'calc(100vh - 180px)' }} // Altura dinâmica
            culture="pt-BR"
            messages={{
              next: "Próximo",
              previous: "Anterior",
              today: "Hoje",
              month: "Mês",
              week: "Semana",
              day: "Dia",
              agenda: "Agenda",
              date: "Data",
              time: "Hora",
              event: "Pedido",
              noEventsInRange: "Sem entregas neste período."
            }}
            eventPropGetter={eventStyleGetter} // Aplica as cores
            onSelectEvent={handleSelectEvent} // Clique no evento
          />
        )}
      </Paper>

      {/* Reutilizamos o Modal de Detalhes aqui! */}
      <OrderDetailsModal
        open={selectedOrderId !== null}
        handleClose={handleCloseModal}
        orderId={selectedOrderId}
      />
    </Box>
  );
}