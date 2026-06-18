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

## Fase 6: GPS, Satisfação, Conflitos e Monitoramento
- [x] Schema: adicionar campos GPS (lat/lng) na tabela checkins
- [x] Schema: criar tabela satisfaction_ratings (avaliação pós-evento)
- [x] Migração SQL aplicada
- [x] Backend: check-in recebe e armazena coordenadas GPS
- [x] Backend: check-out dispara prompt de avaliação de satisfação
- [x] Backend: router satisfaction (criar, listar, média por evento)
- [x] Backend: detecção de conflito na escala (mesmo voluntário em horários sobrepostos)
- [x] Backend: endpoint de monitoramento em tempo real (quem está presente agora)
- [x] Frontend: check-in captura GPS do navegador
- [x] Frontend: modal de satisfação após check-out (estrelas + comentário)
- [x] Frontend: escala exibe alerta visual de conflito
- [x] Frontend: painel admin com mapa GPS das presenças ativas
- [x] Frontend: painel admin com satisfação média por evento
- [x] Frontend: painel admin com monitoramento ao vivo (quem está presente agora)

## Fase 7: PWA Instalável
- [x] manifest.json com nome, ícones e cores da Cathedral
- [x] Service Worker com cache offline das rotas principais
- [x] Meta tags PWA no index.html
- [x] Banner de instalação no app para voluntários
- [x] Ícones PWA (192x192 e 512x512)

## Fase 8: QR Code, Confirmação de Escala e Recorrência
- [x] Backend: geração de QR Code por evento
- [x] Backend: check-in via token QR Code
- [x] Frontend: QR Code visível para admin na página de eventos
- [x] Frontend: página de check-in via QR Code para voluntário

## Fase 9: CSV, Foto de Perfil, Filtros e Relatório
- [x] Backend: importação de voluntários via CSV
- [x] Frontend: tela de importação CSV com preview e modelo para download

## Fase 10: Experiência do Voluntário
- [x] Frontend: tela "Meu Próximo Serviço" com contagem regressiva
- [x] Frontend: histórico pessoal de participação do voluntário
- [x] Backend: router de mural de avisos (CRUD)
- [x] Frontend: mural de avisos (admin posta, voluntário lê)
- [x] Frontend: widget de aniversariantes no dashboard admin
- [x] Backend: query de aniversariantes da semana

## Fase 11: Login Independente (e-mail/senha)
- [x] Tabela local_credentials no banco (email, passwordHash)
- [x] Seed do admin: contato@lirolla.com / Pagotto24
- [x] Router de login com e-mail e senha (bcrypt + JWT)
- [x] Router de logout e me (sessão própria)
- [x] Tela de login própria (sem OAuth Manus)
- [x] Proteger rotas com sessão local
- [x] Remover dependência do OAuth Manus do fluxo principal
- [x] Testes de autenticação local
