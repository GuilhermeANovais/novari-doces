import { 
  Box, Typography, Button, Container, Grid, Paper, Accordion, 
  AccordionSummary, AccordionDetails, useTheme 
} from '@mui/material';
import { 
  CheckCircle, ChevronDown, KanbanSquare, TrendingUp, 
  Users, CalendarDays, ArrowRight, ChefHat 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleCtaClick = () => navigate('/register');
  const handleLoginClick = () => navigate('/login');

  return (
    <Box sx={{ bgcolor: 'white', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* --- 1. NAVBAR --- */}
      <Box component="nav" sx={{ borderBottom: '1px solid #eee', py: 2, position: 'sticky', top: 0, bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', zIndex: 100 }}>
        <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ bgcolor: '#1B5E20', color: 'white', p: 0.5, borderRadius: 1, display: 'flex' }}>
              <ChefHat size={24} strokeWidth={1.5} />
            </Box>
            <Typography variant="h6" fontWeight="bold" color="#1B5E20">
              Confeitaria Heaven
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button onClick={handleLoginClick} color="inherit" sx={{ fontWeight: 600 }}>
              Entrar
            </Button>
            <Button 
              onClick={handleCtaClick} 
              variant="contained" 
              color="primary" 
              sx={{ borderRadius: 2, px: 3, fontWeight: 'bold' }}
            >
              Começar Grátis
            </Button>
          </Box>
        </Container>
      </Box>

      {/* --- 2. HERO SECTION --- */}
      <Box sx={{ py: { xs: 8, md: 12 }, textAlign: 'center', background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)' }}>
        <Container maxWidth="md">
          <Chip label="Novo: Controle Financeiro Completo" color="success" size="small" variant="outlined" sx={{ mb: 3, fontWeight: 'bold', bgcolor: 'white' }} />
          <Typography variant="h2" component="h1" sx={{ fontWeight: 800, mb: 3, color: '#1a1a1a', letterSpacing: '-1px', fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
            A Sua Confeitaria,<br /> 
            <Box component="span" sx={{ color: theme.palette.primary.main }}>Finalmente Organizada.</Box>
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 5, lineHeight: 1.6, maxWidth: 700, mx: 'auto' }}>
            Abandone as planilhas complicadas e os pedidos no WhatsApp. 
            Controle a produção, as entregas e o lucro do seu negócio num único lugar.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              onClick={handleCtaClick} 
              variant="contained" 
              size="large" 
              endIcon={<ArrowRight />}
              sx={{ py: 2, px: 5, borderRadius: 3, fontSize: '1.1rem', fontWeight: 'bold', boxShadow: '0 10px 20px rgba(27, 94, 32, 0.15)' }}
            >
              Testar Grátis por 14 Dias
            </Button>
            <Button variant="outlined" size="large" sx={{ py: 2, px: 4, borderRadius: 3, fontSize: '1.1rem', fontWeight: 600 }}>
              Ver Demonstração
            </Button>
          </Box>
          <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
            Sem cartão de crédito necessário • Cancele quando quiser
          </Typography>
        </Container>
      </Box>

      {/* --- 3. FEATURES (DORES E SOLUÇÕES) --- */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
              Chega de perder pedidos no meio da bagunça.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: '1.1rem' }}>
              O Heaven foi criado especificamente para confeiteiras que precisam de organização profissional sem a complexidade de softwares genéricos.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FeatureItem 
                icon={<KanbanSquare />} 
                title="Quadro de Produção Visual" 
                text="Arraste os pedidos de 'A Fazer' para 'No Forno' e 'Pronto'. Saiba exatamente o que a cozinha precisa fazer agora."
              />
              <FeatureItem 
                icon={<TrendingUp />} 
                title="Relatórios de Lucro Real" 
                text="Pare de adivinhar. Saiba exatamente quanto ganhou no mês, descontando ingredientes e despesas fixas."
              />
              <FeatureItem 
                icon={<CalendarDays />} 
                title="Calendário de Entregas" 
                text="Visualize todas as encomendas do mês. Nunca mais esqueça uma festa ou uma entrega importante."
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            {/* Imagem Ilustrativa / Screenshot Abstrato */}
            <Box 
              sx={{ 
                bgcolor: '#f3f4f6', height: 500, width: 700, borderRadius: 4, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid #e5e7eb', boxShadow: '0 20px 40px rgba(0,0,0,0.08)'
              }}
            >
              <Typography color="text.secondary" fontWeight="bold">[Imagem do Kanban ou Dashboard]</Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* --- 4. PRICING --- */}
      <Box sx={{ bgcolor: '#f9fafb', py: 10 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8}>
            <Typography variant="h3" fontWeight="bold" mb={2}>Planos que cabem no seu bolso</Typography>
            <Typography color="text.secondary">Comece pequeno e cresça connosco.</Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            {/* Plano Iniciante */}
            <Grid item xs={12} md={4}>
              <PricingCard 
                title="Boleira Iniciante" 
                price="39,90" 
                features={[
                  "Até 50 pedidos/mês",
                  "Gestão de Clientes",
                  "Calendário de Entregas",
                  "Cadastro de Produtos",
                  "1 Utilizador"
                ]} 
              />
            </Grid>

            {/* Plano Pro */}
            <Grid item xs={12} md={4}>
              <PricingCard 
                title="Confeitaria Pro" 
                price="69,90" 
                highlight
                features={[
                  "Pedidos Ilimitados",
                  "Kanban de Produção",
                  "Relatórios Financeiros Avançados",
                  "Gestão de Despesas",
                  "Múltiplos Utilizadores (Cozinha/Entrega)",
                  "Suporte Prioritário"
                ]} 
                onCta={handleCtaClick}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* --- 5. FAQ --- */}
      <Container maxWidth="md" sx={{ py: 10 }}>
        <Typography variant="h4" fontWeight="bold" textAlign="center" mb={6}>Perguntas Frequentes</Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FaqItem q="Preciso instalar algo no computador?" a="Não! O Heaven é 100% online. Você pode aceder pelo computador, tablet ou telemóvel." />
          <FaqItem q="Consigo exportar os pedidos?" a="Sim, pode gerar PDFs dos pedidos para enviar para a cozinha ou como recibo para o cliente." />
          <FaqItem q="Como funciona o pagamento?" a="Aceitamos cartão de crédito e PIX. A cobrança é mensal e pode cancelar a qualquer momento sem multa." />
        </Box>
      </Container>

      {/* --- 6. FOOTER --- */}
      <Box sx={{ bgcolor: '#1a1a1a', color: 'white', py: 6, mt: 'auto' }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 3 }}>
            <ChefHat size={24} />
            <Typography variant="h6" fontWeight="bold">Confeitaria Heaven</Typography>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            © {new Date().getFullYear()} Novari Tech. Feito com amor e código.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

// --- Sub-componentes ---

function FeatureItem({ icon, title, text }: { icon: any, title: string, text: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Box sx={{ color: '#1B5E20', bgcolor: '#e8f5e9', width: 48, height: 48, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" fontWeight="bold" gutterBottom>{title}</Typography>
        <Typography variant="body2" color="text.secondary" lineHeight={1.6}>{text}</Typography>
      </Box>
    </Box>
  );
}

function PricingCard({ title, price, features, highlight, onCta }: { title: string, price: string, features: string[], highlight?: boolean, onCta?: () => void }) {
  return (
    <Paper 
      elevation={highlight ? 4 : 1} 
      sx={{ 
        p: 4, borderRadius: 4, height: '100%', 
        border: highlight ? '2px solid #1B5E20' : '1px solid #e0e0e0',
        position: 'relative',
        display: 'flex', flexDirection: 'column'
      }}
    >
      {highlight && (
        <Chip label="Mais Popular" color="primary" size="small" sx={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontWeight: 'bold' }} />
      )}
      <Typography variant="h6" fontWeight="bold" color="text.secondary" gutterBottom>{title}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 4 }}>
        <Typography variant="h3" fontWeight="800">R$ {price}</Typography>
        <Typography color="text.secondary">/mês</Typography>
      </Box>
      
      <Box sx={{ mb: 4, flexGrow: 1 }}>
        {features.map((feature, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
            <CheckCircle size={20} color="#1B5E20" />
            <Typography variant="body2">{feature}</Typography>
          </Box>
        ))}
      </Box>

      <Button 
        variant={highlight ? "contained" : "outlined"} 
        fullWidth 
        size="large"
        onClick={onCta}
        sx={{ borderRadius: 2, py: 1.5, fontWeight: 'bold' }}
      >
        Escolher Plano
      </Button>
    </Paper>
  );
}

function FaqItem({ q, a }: { q: string, a: string }) {
  return (
    <Accordion elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: '8px !important', mb: 1, '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ChevronDown />}>
        <Typography fontWeight="bold">{q}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography color="text.secondary">{a}</Typography>
      </AccordionDetails>
    </Accordion>
  );
}

function Chip({ label, ...props }: any) {
  return (
    <Box 
      sx={{ 
        display: 'inline-block', px: 1.5, py: 0.5, borderRadius: 10, 
        fontSize: '0.75rem', fontWeight: 'bold', 
        bgcolor: props.color === 'success' ? '#e8f5e9' : '#e3f2fd',
        color: props.color === 'success' ? '#1b5e20' : '#1976d2',
        border: '1px solid',
        borderColor: props.color === 'success' ? '#a5d6a7' : '#90caf9',
        ...props.sx 
      }}
    >
      {label}
    </Box>
  )
}
