import { Box, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { OrderSummary } from '../types/entities';

// Configuração do Localizador (Data em Português)
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

export function OrderCalendarPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // 1. FETCHING PEDIDOS
  const { data: orders = [], isLoading, isError } = useQuery({
    queryKey: ['orders-calendar'],
    queryFn: async () => {
      const response = await api.get<OrderSummary[]>('/orders');
      return response.data;
    },
    // Recarrega a cada 1 minuto para manter o calendário atualizado
    refetchInterval: 60000, 
  });

  // 2. TRANSFORMAR PEDIDOS EM EVENTOS DO CALENDÁRIO
  const events = orders
    .filter(order => order.deliveryDate) // Só mostra pedidos com data
    .map(order => {
      const date = new Date(order.deliveryDate!);
      return {
        id: order.id,
        title: `#${order.id} - ${order.client?.name || 'Balcão'}`,
        start: date,
        end: new Date(date.getTime() + 60 * 60 * 1000), // Assume duração de 1h visualmente
        resource: order,
        status: order.status
      };
    });

  // Estilização condicional dos eventos baseada no status
  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#3174ad';
    if (event.status === 'PENDENTE') backgroundColor = '#f59e0b'; // Laranja
    if (event.status === 'PRONTO') backgroundColor = '#10b981'; // Verde
    if (event.status === 'CONCLUÍDO') backgroundColor = '#3b82f6'; // Azul
    if (event.status === 'CANCELADO') backgroundColor = '#ef4444'; // Vermelho

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

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  if (isError) return <Alert severity="error">Erro ao carregar o calendário.</Alert>;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
        Calendário de Entregas
      </Typography>

      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          flexGrow: 1, 
          border: '1px solid #e0e0e0', 
          borderRadius: 2,
          bgcolor: 'white'
        }}
      >
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%', minHeight: 500 }}
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
            event: "Evento",
            noEventsInRange: "Sem entregas neste período."
          }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(event) => setSelectedOrderId(Number(event.id))}
        />
      </Paper>

      <OrderDetailsModal
        open={selectedOrderId !== null}
        handleClose={() => setSelectedOrderId(null)}
        orderId={selectedOrderId}
      />
    </Box>
  );
}
