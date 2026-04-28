import { HttpClient } from '../api/http-client';
import { EventSummary, ResultRow, Survey } from '../types/domain';

/**
 * Facade + Singleton para hablar con el backend.
 *
 * - **Facade**: las páginas piden `votifyApi.crearEvento(...)` sin conocer
 *   rutas HTTP ni headers. Cambiar la API REST sólo afecta a este archivo.
 * - **Singleton**: una sola instancia compartida (`votifyApi`). Constructor
 *   privado para forzar el uso de `getInstance()`.
 *
 * El header `x-user-id` reemplaza a un JWT y permite que el backend sepa
 * qué usuario lanza cada request autenticada.
 */
export interface LoginPayload {
  correo: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  nombre: string;
}

export class VotifyApiFacade {
  private static instance: VotifyApiFacade | null = null;
  private readonly http: HttpClient;

  private constructor() {
    this.http = new HttpClient(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000');
  }

  /** Devuelve la única instancia compartida del facade. */
  static getInstance(): VotifyApiFacade {
    if (!VotifyApiFacade.instance) {
      VotifyApiFacade.instance = new VotifyApiFacade();
    }
    return VotifyApiFacade.instance;
  }

  // ───────── Auth ─────────

  login(payload: LoginPayload) {
    return this.http.post('/auth/login', payload);
  }

  register(payload: RegisterPayload) {
    return this.http.post('/auth/register', payload);
  }

  me(userId: string) {
    return this.http.get('/auth/me', userId);
  }

  getAdminEvents(userId: string) {
    return this.http.get<EventSummary[]>('/events', userId);
  }

  getPublicEvents() {
    return this.http.get<Array<{ id: number; nombre: string; imagen_url?: string | null }>>('/events/public/options');
  }

  getPublicCompetitions(eventId: number) {
    return this.http.get<Array<{ id: number; nombre: string }>>(`/events/${eventId}/competitions`);
  }

  createEvent(userId: string, payload: unknown) {
    return this.http.post<EventSummary>('/events', payload, userId);
  }

  getEvent(eventId: number) {
    return this.http.get<EventSummary>(`/events/${eventId}`);
  }

  updateEvent(eventId: number, payload: unknown) {
    return this.http.patch<EventSummary>(`/events/${eventId}`, payload);
  }

  createCompetition(eventId: number, payload: unknown) {
    return this.http.post(`/events/${eventId}/competitions`, payload);
  }

  updateCompetition(competitionId: number, payload: unknown) {
    return this.http.patch(`/competitions/${competitionId}`, payload);
  }

  getCompetitionManagement(competitionId: number) {
    return this.http.get(`/competitions/${competitionId}/management`);
  }

  createTeam(competitionId: number, payload: unknown) {
    return this.http.post(`/competitions/${competitionId}/teams`, payload);
  }

  updateTeam(teamId: number, payload: unknown) {
    return this.http.patch(`/teams/${teamId}`, payload);
  }

  deleteTeam(teamId: number) {
    return this.http.delete(`/teams/${teamId}`);
  }

  createCriterion(competitionId: number, payload: unknown) {
    return this.http.post(`/competitions/${competitionId}/criteria`, payload);
  }

  updateCriterion(criterionId: number, payload: unknown) {
    return this.http.patch(`/criteria/${criterionId}`, payload);
  }

  deleteCriterion(criterionId: number) {
    return this.http.delete(`/criteria/${criterionId}`);
  }

  createSurvey(userId: string, competitionId: number, payload: unknown) {
    return this.http.post<Survey>(`/competitions/${competitionId}/surveys`, payload, userId);
  }

  assignJudge(competitionId: number, payload: unknown) {
    return this.http.post(`/competitions/${competitionId}/judges`, payload);
  }

  removeJudge(competitionId: number, personId: string) {
    return this.http.delete(`/competitions/${competitionId}/judges/${personId}`);
  }

  submitJudgeVote(userId: string, surveyId: number, projectId: number, payload: unknown) {
    return this.http.post(`/judge/surveys/${surveyId}/projects/${projectId}/votes`, payload, userId);
  }

  getJudgeSurveys(userId: string) {
    return this.http.get<Survey[]>('/judge/surveys', userId);
  }

  getJudgeVotingForm(surveyId: number, projectId: number) {
    return this.http.get(`/judge/surveys/${surveyId}/projects/${projectId}/form`);
  }

  getPublicRoom(code: string) {
    return this.http.get(`/public/rooms/${code}`);
  }

  identifyPublicVoter(code: string, payload: { correo: string }) {
    return this.http.post(`/public/rooms/${code}/identify`, payload);
  }

  submitPublicVote(code: string, payload: unknown) {
    return this.http.post(`/public/rooms/${code}/votes`, payload);
  }

  getSurveyResults(surveyId: number) {
    return this.http.get<ResultRow[]>(`/surveys/${surveyId}/results`);
  }

  getSurveyLiveResults(surveyId: number) {
    return this.http.get<ResultRow[]>(`/surveys/${surveyId}/results/live`);
  }

  recalculateResults(surveyId: number) {
    return this.http.post<ResultRow[]>(`/surveys/${surveyId}/results/recalculate`);
  }

  getSurvey(surveyId: number) {
    return this.http.get<Survey>(`/surveys/${surveyId}`);
  }

  updateSurveyState(surveyId: number, estado: 'borrador' | 'abierta' | 'programada' | 'cerrada') {
    return this.http.patch(`/surveys/${surveyId}/state`, { estado });
  }

  deleteSurvey(surveyId: number) {
    return this.http.delete(`/surveys/${surveyId}`);
  }

  updateSurveySchedule(surveyId: number, payload: { horaApertura?: string | null; horaCierre?: string | null }) {
    return this.http.patch(`/surveys/${surveyId}/schedule`, payload);
  }

  getSurveyCriteria(surveyId: number) {
    return this.http.get<Array<{ id: number; titulo: string; tipo: string; peso: number }>>(`/surveys/${surveyId}/criteria`);
  }

  getSurveyAssignments(surveyId: number) {
    return this.http.get<{
      equiposDisponibles: Array<{ id: number; nombre: string; proyecto?: Array<{ nombre: string }> }>;
      equiposAsignados: number[];
      juecesDisponibles: Array<{ persona_id: string; persona?: { nombre?: string; correo?: string } }>;
      juecesAsignados: string[];
    }>(`/surveys/${surveyId}/assignments`);
  }

  updateSurveyAssignments(surveyId: number, equipoIds: number[], juecesIds: string[]) {
    return this.http.patch(`/surveys/${surveyId}/assignments`, { equipoIds, juecesIds });
  }

  processScheduledSurveys(surveyId?: number, competicionId?: number) {
    const params = new URLSearchParams();
    if (competicionId != null) params.set('competicionId', String(competicionId));
    const query = params.toString() ? `?${params}` : '';
    const base = surveyId != null ? `/surveys/${surveyId}/process-scheduled` : '/surveys/process-scheduled';
    return this.http.post(base + query);
  }

  getSurveyFormData(competitionId: number) {
    return this.http.get<{ equipos: Array<{ id: number; nombre: string }>; jueces: Array<{ id: string; nombre: string; correo: string }> }>(`/competitions/${competitionId}/survey-form`);
  }

  uploadEventImage(eventId: number, payload: { base64: string; contentType: string; extension: string }) {
    return this.http.post<{ imagenUrl: string }>(`/events/${eventId}/image`, payload);
  }

  updateManualScore(resultId: number, puntajeManual: number | null) {
    return this.http.patch(`/results/${resultId}/manual-score`, { puntajeManual });
  }

  getPublicVotingForm(codigo: string) {
    return this.http.get(`/public/rooms/${codigo}/form`);
  }

  getPublicResults(codigo: string) {
    return this.http.get<ResultRow[]>(`/public/rooms/${codigo}/results`);
  }

  getSurveyComments(surveyId: number) {
    return this.http.get<Array<{ texto: string; criterio: string; proyecto: string; origen: 'Público' | 'Jurado' }>>(`/surveys/${surveyId}/comments`);
  }

  getMyParticipantDashboard(userId: string) {
    return this.http.get('/participants/me/dashboard', userId);
  }

  getParticipantDashboard(participantId: number) {
    return this.http.get(`/participants/${participantId}/dashboard`);
  }

  getParticipantDashboardByEmail(correo: string) {
    return this.http.get(`/participants/by-email/dashboard?correo=${encodeURIComponent(correo)}`);
  }

  updateParticipant(participantId: number, payload: unknown) {
    return this.http.patch(`/participants/${participantId}`, payload);
  }
}

export const votifyApi = VotifyApiFacade.getInstance();
