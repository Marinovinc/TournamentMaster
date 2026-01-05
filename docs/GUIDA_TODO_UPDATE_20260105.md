# TournamentMaster - Guida Completa Gestione Barche e Strike

---

## TODO - Stato Attuale (2026-01-05)

> **Ultimo aggiornamento:** 2026-01-05 18:30 | **Priorita:** CRITICA

### Funzionalita Completate (Sessione Delete Team)

- [x] **Delete Team** - Eliminazione barca con conferma dialog (commit 456da9d)
- [x] **Create Team con Captain** - Selezione capitano alla creazione  
- [x] **REGISTRATION_OPEN status** - Fix crash TournamentCard (commit a61bbd3)
- [x] **Backend Crew Roles** - Validazione ruoli
- [x] **Nuovo endpoint** - POST /teams/:id/members/external per membri esterni
- [x] **Campi representing club** - representingClubName, representingClubCode

### Blocchi Critici

- [ ] **Sbloccare Prisma Client** - File query_engine-windows.dll.node locked

### Backend da Completare

- [ ] **Migrazione dati** - UPDATE team_members SET role = TEAM_LEADER WHERE role = CAPTAIN
- [ ] **Test E2E Delete** - Verificare cascade delete team_members

### Frontend da Completare

- [ ] **teams/page.tsx** - Aggiornare getRoleBadge() con nuovi ruoli
- [ ] **teams/page.tsx** - Interfaccia TeamMember con campi esterni
- [ ] **teams/page.tsx** - Dialog Aggiungi membro esterno
- [ ] **teams/page.tsx** - Campo Associazione Rappresentata per provinciali

---

## Documenti Correlati

| Documento | Descrizione |
|-----------|-------------|
| [HANDOVER_SESSIONE_DELETE_TEAM_20260105.md](./HANDOVER_SESSIONE_DELETE_TEAM_20260105.md) | Handover sessione Delete Team (con errori confessati) |
| [DOCUMENTAZIONE_TECNICA_DELETE_TEAM_20260105.md](./DOCUMENTAZIONE_TECNICA_DELETE_TEAM_20260105.md) | Documentazione tecnica Delete Team + Fix REGISTRATION_OPEN |
| [HANDOVER_SESSIONE_CREW_ROLES_20260105.md](./HANDOVER_SESSIONE_CREW_ROLES_20260105.md) | Handover sessione Crew Roles |
| [DOCUMENTAZIONE_TECNICA_CREW_ROLES_20260105.md](./DOCUMENTAZIONE_TECNICA_CREW_ROLES_20260105.md) | Documentazione tecnica Crew Roles |
| [ARCHITETTURA_FRONTEND_BACKEND_E_GITHUB.md](./ARCHITETTURA_FRONTEND_BACKEND_E_GITHUB.md) | Architettura sistema e workflow GitHub |

---

Vedere il resto della guida nel file originale.
