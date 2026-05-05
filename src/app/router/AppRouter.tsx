import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../../shared/layout/ProtectedRoute';
import { LoginPage } from '../../features/auth/LoginPage';
import { AccessPage } from '../../features/access/AccessPage';
import { AdminDashboardPage } from '../../features/admin/AdminDashboardPage';
import { EventCreatePage } from '../../features/admin/EventCreatePage';
import { EventEditPage } from '../../features/admin/EventEditPage';
import { CompetitionManagementPage } from '../../features/admin/CompetitionManagementPage';
import { SurveyCreatePage } from '../../features/admin/SurveyCreatePage';
import { SurveyResultsPage } from '../../features/results/SurveyResultsPage';
import { JudgeDashboardPage } from '../../features/judge/JudgeDashboardPage';
import { JudgeVotePage } from '../../features/judge/JudgeVotePage';
import { EnterRoomPage } from '../../features/public-voting/EnterRoomPage';
import { IdentifyPublicPage } from '../../features/public-voting/IdentifyPublicPage';
import { PublicVotePage } from '../../features/public-voting/PublicVotePage';
import { PublicResultsPage } from '../../features/public-voting/PublicResultsPage';
import { ParticipantDashboardPage } from '../../features/participant/ParticipantDashboardPage';
import { ParticipantLiveResultsPage } from '../../features/participant/ParticipantLiveResultsPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EnterRoomPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/acceso" element={<AccessPage />} />
        <Route path="/sala" element={<EnterRoomPage />} />
        <Route path="/sala/:codigo" element={<IdentifyPublicPage />} />
        <Route path="/sala/:codigo/votar" element={<PublicVotePage />} />
        <Route path="/sala/:codigo/resultados" element={<PublicResultsPage />} />
        <Route path="/participante/dashboard" element={<ParticipantDashboardPage />} />
        <Route path="/participante/encuestas/:surveyId/resultados" element={<ParticipantLiveResultsPage />} />

        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/eventos/nuevo" element={<EventCreatePage />} />
          <Route path="/admin/eventos/:eventId/editar" element={<EventEditPage />} />
          <Route path="/admin/competiciones/:competitionId" element={<CompetitionManagementPage />} />
          <Route path="/admin/competiciones/:competitionId/encuesta/nueva" element={<SurveyCreatePage />} />
          <Route path="/admin/encuestas/:surveyId/resultados" element={<SurveyResultsPage />} />
          <Route path="/admin/participantes/:participantId" element={<ParticipantDashboardPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredRole="juez" />}>
          <Route path="/juez" element={<JudgeDashboardPage />} />
          <Route path="/juez/encuesta/:surveyId/proyecto/:projectId" element={<JudgeVotePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
