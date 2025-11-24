// src/pages/OrderCalendarPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import api from '../api';
import { OrderSummary } from '../types/entities';
import { OrderDetailsModal } from '../components/OrderDetailsModal';

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

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  status: string;
}

export function OrderCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<OrderSummary[]>('/orders');
      
      const formattedEvents: CalendarEvent[] = response.data
        .filter(order => order.deliveryDate)
        .map(order => {
          const startDate = new Date(order.deliveryDate!);
          const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hora de duração
          
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

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#1976d2';
    if (event.status === 'CONCLUÍDO') backgroundColor = '#2e7d32';
    if (event.status === 'CANCELADO') backgroundColor = '#d32f2f';
    if (event.status === 'PENDENTE') backgroundColor = '#ed6c02';

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        padding: '2px 5px',
        fontSize: '0.85rem'
      }
    };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedOrderId(event.id);
  };

  const handleCloseModal = () => {
    setSelectedOrderId(null);
    fetchOrders(); 
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
        Calendário de Entregas
      </Typography>

      <Paper 
        elevation={0} // Design flat
        sx={{ 
          p: 3, 
          flexGrow: 1, 
          backgroundColor: 'white', 
          border: '1px solid #e0e0e0', 
          borderRadius: 2 
        }}
      >
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
            style={{ height: 'calc(100vh - 180px)' }}
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
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
          />
        )}
      </Paper>

      <OrderDetailsModal
        open={selectedOrderId !== null}
        handleClose={handleCloseModal}
        orderId={selectedOrderId}
      />
    </Box>
  );
}