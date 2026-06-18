# Cathedral Volunteers - TODO

## Fase 1: Schema e Banco de Dados
- [x] Schema: tabela volunteers (perfil completo)
- [x] Schema: tabela networks (redes)
- [x] Schema: tabela ministries (ministérios)
- [x] Schema: tabela events (eventos)
- [x] Schema: tabela schedules (escalas)
- [x] Schema: tabela schedule_assignments (voluntários na escala)
- [x] Schema: tabela checkins (check-in/out)
- [x] Schema: tabela notifications (notificações)
- [x] Migração SQL aplicada

## Fase 2: Backend (tRPC Routers)
- [x] Router: volunteers (CRUD, listar, buscar)
- [x] Router: networks (listar, criar, editar)
- [x] Router: ministries (listar, criar, editar)
- [x] Router: events (CRUD)
- [x] Router: schedules (criar escala, atribuir voluntários)
- [x] Router: checkins (check-in, check-out, histórico)
- [x] Router: notifications (enviar, listar, marcar como lida)
- [x] Router: reports (presença, participação, histórico)
- [x] Seed de dados: redes e ministérios padrão

## Fase 3: Frontend - Layout e Páginas Principais
- [x] Tema visual premium (cores, tipografia, CSS global)
- [x] DashboardLayout customizado com sidebar elegante
- [x] Página: Login / Landing
- [x] Página: Dashboard Admin
- [x] Página: Dashboard Voluntário
- [x] Página: Gestão de Voluntários (admin)
- [x] Página: Perfil do Voluntário
- [x] Página: Redes e Ministérios (admin)
- [x] Página: Gestão de Eventos (admin)

## Fase 4: Funcionalidades Avançadas
- [x] Página: Escalas do Dia
- [x] Página: Check-in / Check-out
- [x] Página: Notificações
- [x] Página: Relatórios (presença, participação)
- [x] Controle de permissões Admin vs Voluntário

## Fase 5: Testes e Entrega
- [x] Testes Vitest para routers principais (8 testes passando)
- [x] Revisão visual e responsividade
- [x] Checkpoint final
