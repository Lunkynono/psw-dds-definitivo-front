export type Language = 'en' | 'es';

type ExactTranslation = {
  es: string;
  en: string;
};

export type TranslationStrategy = {
  code: Language;
  label: string;
  shortLabel: string;
  locale: string;
  translate: (text: string) => string;
};

export const LANGUAGE_STORAGE_KEY = 'votify_language';

const exact: Record<string, ExactTranslation> = {
  Admin: { es: 'Admin', en: 'Admin' },
  Juez: { es: 'Juez', en: 'Judge' },
  Participante: { es: 'Participante', en: 'Participant' },
  administrador: { es: 'administrador', en: 'administrator' },
  juez: { es: 'juez', en: 'judge' },
  participante: { es: 'participante', en: 'participant' },
  Salir: { es: 'Salir', en: 'Log out' },
  Administrador: { es: 'Administrador', en: 'Administrator' },
  'Gestiona eventos, competiciones, equipos y encuestas.': {
    es: 'Gestiona eventos, competiciones, equipos y encuestas.',
    en: 'Manage events, competitions, teams, and surveys.',
  },
  'Evalua los proyectos asignados en las competiciones.': {
    es: 'Evalua los proyectos asignados en las competiciones.',
    en: 'Evaluate assigned competition projects.',
  },
  'Inscribe tu equipo o proyecto en una competicion.': {
    es: 'Inscribe tu equipo o proyecto en una competicion.',
    en: 'Register your team or project for a competition.',
  },
  'Selecciona tu rol para continuar': { es: 'Selecciona tu rol para continuar', en: 'Select your role to continue' },
  'Ver mi dashboard': { es: 'Ver mi dashboard', en: 'View my dashboard' },
  'Inscribir equipo': { es: 'Inscribir equipo', en: 'Register team' },
  'Volver al inicio': { es: 'Volver al inicio', en: 'Back to start' },
  'Acceso administrador': { es: 'Acceso administrador', en: 'Administrator access' },
  'Acceso juez': { es: 'Acceso juez', en: 'Judge access' },
  'Acceso participante': { es: 'Acceso participante', en: 'Participant access' },
  'Crea tu cuenta': { es: 'Crea tu cuenta', en: 'Create your account' },
  Nombre: { es: 'Nombre', en: 'Name' },
  'Tu nombre completo': { es: 'Tu nombre completo', en: 'Your full name' },
  'Correo electronico': { es: 'Correo electronico', en: 'Email' },
  Contrasena: { es: 'Contrasena', en: 'Password' },
  'Crear cuenta': { es: 'Crear cuenta', en: 'Create account' },
  Entrar: { es: 'Entrar', en: 'Sign in' },
  'Entrar como': { es: 'Entrar como', en: 'Sign in as' },
  'Cargando...': { es: 'Cargando...', en: 'Loading...' },
  'Ya tienes cuenta?': { es: 'Ya tienes cuenta?', en: 'Already have an account?' },
  'No tienes cuenta?': { es: 'No tienes cuenta?', en: "Don't have an account?" },
  'Iniciar sesion': { es: 'Iniciar sesion', en: 'Sign in' },
  Registrarse: { es: 'Registrarse', en: 'Sign up' },
  'Introduce el codigo de sala para votar': { es: 'Introduce el codigo de sala para votar', en: 'Enter the room code to vote' },
  Buscando: { es: 'Buscando', en: 'Searching' },
  'Buscando...': { es: 'Buscando...', en: 'Searching...' },
  Votar: { es: 'Votar', en: 'Vote' },
  'Ver resultados en vivo': { es: 'Ver resultados en vivo', en: 'View live results' },
  'Eres admin, juez o participante?': { es: 'Eres admin, juez o participante?', en: 'Are you an admin, judge, or participant?' },
  'Acceder al sistema': { es: 'Acceder al sistema', en: 'Access the system' },
  'Mis eventos': { es: 'Mis eventos', en: 'My events' },
  'Gestiona tus competiciones y encuestas': { es: 'Gestiona tus competiciones y encuestas', en: 'Manage your competitions and surveys' },
  'Nuevo evento': { es: 'Nuevo evento', en: 'New event' },
  'No tienes eventos aun': { es: 'No tienes eventos aun', en: 'You do not have any events yet' },
  'Crea tu primer evento para empezar': { es: 'Crea tu primer evento para empezar', en: 'Create your first event to get started' },
  'Crear evento': { es: 'Crear evento', en: 'Create event' },
  'Informacion del evento': { es: 'Informacion del evento', en: 'Event information' },
  'Nombre del evento *': { es: 'Nombre del evento *', en: 'Event name *' },
  Lugar: { es: 'Lugar', en: 'Location' },
  Descripcion: { es: 'Descripcion', en: 'Description' },
  'Imagen del evento': { es: 'Imagen del evento', en: 'Event image' },
  'Seleccionar imagen': { es: 'Seleccionar imagen', en: 'Select image' },
  Competiciones: { es: 'Competiciones', en: 'Competitions' },
  'Anadir competicion': { es: 'Anadir competicion', en: 'Add competition' },
  Cancelar: { es: 'Cancelar', en: 'Cancel' },
  Guardar: { es: 'Guardar', en: 'Save' },
  'Guardar cambios': { es: 'Guardar cambios', en: 'Save changes' },
  'Eliminar evento': { es: 'Eliminar evento', en: 'Delete event' },
  'Nueva competicion': { es: 'Nueva competicion', en: 'New competition' },
  Anadir: { es: 'Anadir', en: 'Add' },
  Informacion: { es: 'Informacion', en: 'Information' },
  'Cambiar imagen': { es: 'Cambiar imagen', en: 'Change image' },
  'Subir imagen': { es: 'Subir imagen', en: 'Upload image' },
  'Subiendo...': { es: 'Subiendo...', en: 'Uploading...' },
  'No hay competiciones aun': { es: 'No hay competiciones aun', en: 'No competitions yet' },
  Equipos: { es: 'Equipos', en: 'Teams' },
  'Anadir equipo': { es: 'Anadir equipo', en: 'Add team' },
  'Nombre del equipo *': { es: 'Nombre del equipo *', en: 'Team name *' },
  'Nombre del proyecto *': { es: 'Nombre del proyecto *', en: 'Project name *' },
  'Descripcion del proyecto': { es: 'Descripcion del proyecto', en: 'Project description' },
  Participantes: { es: 'Participantes', en: 'Participants' },
  Correo: { es: 'Correo', en: 'Email' },
  'Correo *': { es: 'Correo *', en: 'Email *' },
  Rol: { es: 'Rol', en: 'Role' },
  'Rol *': { es: 'Rol *', en: 'Role *' },
  Criterios: { es: 'Criterios', en: 'Criteria' },
  'Anadir criterio': { es: 'Anadir criterio', en: 'Add criterion' },
  'Editar criterio': { es: 'Editar criterio', en: 'Edit criterion' },
  'Crear criterio': { es: 'Crear criterio', en: 'Create criterion' },
  Titulo: { es: 'Titulo', en: 'Title' },
  'Titulo *': { es: 'Titulo *', en: 'Title *' },
  Tipo: { es: 'Tipo', en: 'Type' },
  Peso: { es: 'Peso', en: 'Weight' },
  Numerico: { es: 'Numerico', en: 'Numeric' },
  Rubrica: { es: 'Rubrica', en: 'Rubric' },
  Comentario: { es: 'Comentario', en: 'Comment' },
  Min: { es: 'Min', en: 'Min' },
  Max: { es: 'Max', en: 'Max' },
  Aspectos: { es: 'Aspectos', en: 'Aspects' },
  Aspecto: { es: 'Aspecto', en: 'Aspect' },
  Opciones: { es: 'Opciones', en: 'Options' },
  Opcion: { es: 'Opcion', en: 'Option' },
  Opcional: { es: 'Opcional', en: 'Optional' },
  Asignado: { es: 'Asignado', en: 'Assigned' },
  Ilimitado: { es: 'Ilimitado', en: 'Unlimited' },
  Jurado: { es: 'Jurado', en: 'Judges' },
  Encuestas: { es: 'Encuestas', en: 'Surveys' },
  'Nueva encuesta': { es: 'Nueva encuesta', en: 'New survey' },
  Horario: { es: 'Horario', en: 'Schedule' },
  Apertura: { es: 'Apertura', en: 'Opening' },
  Cierre: { es: 'Cierre', en: 'Closing' },
  Quitar: { es: 'Quitar', en: 'Remove' },
  'Informacion de la encuesta': { es: 'Informacion de la encuesta', en: 'Survey information' },
  'Tipo de votante': { es: 'Tipo de votante', en: 'Voter type' },
  Publico: { es: 'Publico', en: 'Public' },
  Ambos: { es: 'Ambos', en: 'Both' },
  'Seleccionar todos': { es: 'Seleccionar todos', en: 'Select all' },
  'Asignar todos': { es: 'Asignar todos', en: 'Assign all' },
  'Guardar borrador': { es: 'Guardar borrador', en: 'Save draft' },
  'Programar encuesta': { es: 'Programar encuesta', en: 'Schedule survey' },
  'Crear y abrir': { es: 'Crear y abrir', en: 'Create and open' },
  'Crear y anadir': { es: 'Crear y anadir', en: 'Create and add' },
  'Panel del juez': { es: 'Panel del juez', en: 'Judge dashboard' },
  'Tus encuestas asignadas y proyectos pendientes de evaluacion': {
    es: 'Tus encuestas asignadas y proyectos pendientes de evaluacion',
    en: 'Your assigned surveys and pending project evaluations',
  },
  'Mi panel': { es: 'Mi panel', en: 'My dashboard' },
  'Mis encuestas': { es: 'Mis encuestas', en: 'My surveys' },
  'Ver resultados': { es: 'Ver resultados', en: 'View results' },
  Completado: { es: 'Completado', en: 'Completed' },
  Evaluar: { es: 'Evaluar', en: 'Evaluate' },
  'Formulario de votacion': { es: 'Formulario de votacion', en: 'Voting form' },
  'Votacion anonima': { es: 'Votacion anonima', en: 'Anonymous voting' },
  'Enviar voto': { es: 'Enviar voto', en: 'Submit vote' },
  'Enviando...': { es: 'Enviando...', en: 'Submitting...' },
  'Escribe tu comentario...': { es: 'Escribe tu comentario...', en: 'Write your comment...' },
  'Tu comentario...': { es: 'Tu comentario...', en: 'Your comment...' },
  Volver: { es: 'Volver', en: 'Back' },
  Continuar: { es: 'Continuar', en: 'Continue' },
  'Verificando...': { es: 'Verificando...', en: 'Verifying...' },
  'Introduce tu correo para votar': { es: 'Introduce tu correo para votar', en: 'Enter your email to vote' },
  'Correo electronico *': { es: 'Correo electronico *', en: 'Email *' },
  'Sala no encontrada': { es: 'Sala no encontrada', en: 'Room not found' },
  votos: { es: 'votos', en: 'votes' },
  'En vivo': { es: 'En vivo', en: 'Live' },
  'EN VIVO': { es: 'EN VIVO', en: 'LIVE' },
  'Reconectando...': { es: 'Reconectando...', en: 'Reconnecting...' },
  'Aun no hay votos registrados': { es: 'Aun no hay votos registrados', en: 'No votes registered yet' },
  'Los resultados se actualizan automaticamente': {
    es: 'Los resultados se actualizan automaticamente',
    en: 'Results update automatically',
  },
  'Ver otra sala': { es: 'Ver otra sala', en: 'View another room' },
  'Volver a mi dashboard': { es: 'Volver a mi dashboard', en: 'Back to my dashboard' },
  Resultados: { es: 'Resultados', en: 'Results' },
  Ranking: { es: 'Ranking', en: 'Ranking' },
  Comentarios: { es: 'Comentarios', en: 'Comments' },
  Asignaciones: { es: 'Asignaciones', en: 'Assignments' },
  Borrador: { es: 'Borrador', en: 'Draft' },
  Abierta: { es: 'Abierta', en: 'Open' },
  Programada: { es: 'Programada', en: 'Scheduled' },
  Cerrada: { es: 'Cerrada', en: 'Closed' },
  borrador: { es: 'borrador', en: 'draft' },
  abierta: { es: 'abierta', en: 'open' },
  programada: { es: 'programada', en: 'scheduled' },
  cerrada: { es: 'cerrada', en: 'closed' },
  publico: { es: 'publico', en: 'public' },
  ambos: { es: 'ambos', en: 'both' },
  Publicar: { es: 'Publicar', en: 'Publish' },
  Cerrar: { es: 'Cerrar', en: 'Close' },
  Reabrir: { es: 'Reabrir', en: 'Reopen' },
  Programar: { es: 'Programar', en: 'Schedule' },
  'Editar horario': { es: 'Editar horario', en: 'Edit schedule' },
  'Calcular resultados': { es: 'Calcular resultados', en: 'Calculate results' },
  manual: { es: 'manual', en: 'manual' },
  'Sin proyecto': { es: 'Sin proyecto', en: 'No project' },
  'sin nombre': { es: 'sin nombre', en: 'no name' },
  'sin programar': { es: 'sin programar', en: 'not scheduled' },
  Cierra: { es: 'Cierra', en: 'Closes' },
  'Cierre automatico': { es: 'Cierre automatico', en: 'Automatic closing' },
  'Abrir encuesta': { es: 'Abrir encuesta', en: 'Open survey' },
  'Publicar encuesta': { es: 'Publicar encuesta', en: 'Publish survey' },
  Proyecto: { es: 'Proyecto', en: 'Project' },
  Equipo: { es: 'Equipo', en: 'Team' },
  'Sin equipo': { es: 'Sin equipo', en: 'No team' },
  'Sin competicion': { es: 'Sin competicion', en: 'No competition' },
  'Encuestas y actividad': { es: 'Encuestas y actividad', en: 'Surveys and activity' },
  'Dashboard de participante': { es: 'Dashboard de participante', en: 'Participant dashboard' },
  'Correo del participante': { es: 'Correo del participante', en: 'Participant email' },
  'Inscripcion de participante': { es: 'Inscripcion de participante', en: 'Participant registration' },
  Evento: { es: 'Evento', en: 'Event' },
  Competicion: { es: 'Competicion', en: 'Competition' },
  'Selecciona un evento': { es: 'Selecciona un evento', en: 'Select an event' },
  'Selecciona primero un evento': { es: 'Selecciona primero un evento', en: 'Select an event first' },
  'Selecciona una competicion': { es: 'Selecciona una competicion', en: 'Select a competition' },
  'Selecciona al menos un criterio': { es: 'Selecciona al menos un criterio', en: 'Select at least one criterion' },
  'Selecciona al menos un equipo': { es: 'Selecciona al menos un equipo', en: 'Select at least one team' },
  'Selecciona al menos un jurado': { es: 'Selecciona al menos un jurado', en: 'Select at least one judge' },
  'Cargando eventos...': { es: 'Cargando eventos...', en: 'Loading events...' },
  'Cargando competiciones...': { es: 'Cargando competiciones...', en: 'Loading competitions...' },
  'Nombre *': { es: 'Nombre *', en: 'Name *' },
  Obligatorio: { es: 'Obligatorio', en: 'Required' },
  'Vista previa': { es: 'Vista previa', en: 'Preview' },
  'Nombre de la competicion *': { es: 'Nombre de la competicion *', en: 'Competition name *' },
  'Descripcion (opcional)': { es: 'Descripcion (opcional)', en: 'Description (optional)' },
  'Mi proyecto': { es: 'Mi proyecto', en: 'My project' },
  'No hay criterios. Crea el primero.': { es: 'No hay criterios. Crea el primero.', en: 'No criteria yet. Create the first one.' },
  'No hay equipos en esta competicion': { es: 'No hay equipos en esta competicion', en: 'No teams in this competition' },
  'No hay jurado asignado a esta competicion': { es: 'No hay jurado asignado a esta competicion', en: 'No judges assigned to this competition' },
  'Esta competicion no tiene proyectos visibles para votar.': {
    es: 'Esta competicion no tiene proyectos visibles para votar.',
    en: 'This competition has no visible projects to vote on.',
  },
  'Esta encuesta no tiene criterios configurados.': {
    es: 'Esta encuesta no tiene criterios configurados.',
    en: 'This survey has no configured criteria.',
  },
  'Esta competicion no tiene proyectos disponibles': {
    es: 'Esta competicion no tiene proyectos disponibles',
    en: 'This competition has no available projects',
  },
  'No hay informacion de participante disponible.': {
    es: 'No hay informacion de participante disponible.',
    en: 'No participant information is available.',
  },
  'No hay mas participantes en el equipo.': {
    es: 'No hay mas participantes en el equipo.',
    en: 'There are no more participants on the team.',
  },
  'No hay encuestas asociadas al equipo.': {
    es: 'No hay encuestas asociadas al equipo.',
    en: 'There are no surveys associated with the team.',
  },
  'El equipo todavia no tiene proyecto asociado.': {
    es: 'El equipo todavia no tiene proyecto asociado.',
    en: 'The team does not have an associated project yet.',
  },
  'No se pudieron cargar los eventos': { es: 'No se pudieron cargar los eventos', en: 'Events could not be loaded' },
  'No se pudieron cargar las competiciones': { es: 'No se pudieron cargar las competiciones', en: 'Competitions could not be loaded' },
  'No se pudieron cargar los datos': { es: 'No se pudieron cargar los datos', en: 'Data could not be loaded' },
  'No se pudieron cargar los resultados': { es: 'No se pudieron cargar los resultados', en: 'Results could not be loaded' },
  'No se pudieron cargar las asignaciones': { es: 'No se pudieron cargar las asignaciones', en: 'Assignments could not be loaded' },
  'No se pudieron guardar las asignaciones': { es: 'No se pudieron guardar las asignaciones', en: 'Assignments could not be saved' },
  'Nombre del equipo y proyecto son obligatorios': {
    es: 'Nombre del equipo y proyecto son obligatorios',
    en: 'Team and project names are required',
  },
  'Nombre, correo y rol son obligatorios para cada participante': {
    es: 'Nombre, correo y rol son obligatorios para cada participante',
    en: 'Name, email, and role are required for each participant',
  },
  'Anade al menos un participante': { es: 'Anade al menos un participante', en: 'Add at least one participant' },
  'Anade al menos un aspecto a evaluar': { es: 'Anade al menos un aspecto a evaluar', en: 'Add at least one aspect to evaluate' },
  'Anade al menos dos opciones': { es: 'Anade al menos dos opciones', en: 'Add at least two options' },
  'No se pudo completar la inscripcion': { es: 'No se pudo completar la inscripcion', en: 'Registration could not be completed' },
  'Equipo inscrito correctamente': { es: 'Equipo inscrito correctamente', en: 'Team registered successfully' },
  'Introduce el correo del participante': { es: 'Introduce el correo del participante', en: 'Enter the participant email' },
  'Ver dashboard': { es: 'Ver dashboard', en: 'View dashboard' },
  'Evento *': { es: 'Evento *', en: 'Event *' },
  'Competicion *': { es: 'Competicion *', en: 'Competition *' },
  'Descripcion del evento...': { es: 'Descripcion del evento...', en: 'Event description...' },
  'Equipo Alpha': { es: 'Equipo Alpha', en: 'Team Alpha' },
  'Evento creado pero la imagen no se pudo subir': {
    es: 'Evento creado pero la imagen no se pudo subir',
    en: 'The event was created, but the image could not be uploaded',
  },
  'Evento creado correctamente': { es: 'Evento creado correctamente', en: 'Event created successfully' },
  'No se pudo crear el evento': { es: 'No se pudo crear el evento', en: 'The event could not be created' },
  'No se pudo cargar el evento': { es: 'No se pudo cargar el evento', en: 'The event could not be loaded' },
  'Evento actualizado': { es: 'Evento actualizado', en: 'Event updated' },
  'Evento eliminado': { es: 'Evento eliminado', en: 'Event deleted' },
  'No se pudo eliminar el evento': { es: 'No se pudo eliminar el evento', en: 'The event could not be deleted' },
  'No se pudieron guardar los cambios': { es: 'No se pudieron guardar los cambios', en: 'Changes could not be saved' },
  Guardado: { es: 'Guardado', en: 'Saved' },
  'No se pudo subir la imagen': { es: 'No se pudo subir la imagen', en: 'The image could not be uploaded' },
  'Imagen actualizada': { es: 'Imagen actualizada', en: 'Image updated' },
  'Competicion anadida': { es: 'Competicion anadida', en: 'Competition added' },
  'No se pudo anadir la competicion': { es: 'No se pudo anadir la competicion', en: 'The competition could not be added' },
  'Competicion eliminada': { es: 'Competicion eliminada', en: 'Competition deleted' },
  'No se pudo eliminar la competicion': { es: 'No se pudo eliminar la competicion', en: 'The competition could not be deleted' },
  'No tienes permisos para gestionar este evento': {
    es: 'No tienes permisos para gestionar este evento',
    en: 'You do not have permission to manage this event',
  },
  'No tienes permisos para gestionar esta competicion': {
    es: 'No tienes permisos para gestionar esta competicion',
    en: 'You do not have permission to manage this competition',
  },
  'No hay equipos aun': { es: 'No hay equipos aun', en: 'No teams yet' },
  'No hay criterios aun': { es: 'No hay criterios aun', en: 'No criteria yet' },
  'No hay encuestas aun': { es: 'No hay encuestas aun', en: 'No surveys yet' },
  'Equipo anadido': { es: 'Equipo anadido', en: 'Team added' },
  'Equipo actualizado': { es: 'Equipo actualizado', en: 'Team updated' },
  'Equipo eliminado': { es: 'Equipo eliminado', en: 'Team deleted' },
  'No se pudo anadir el equipo': { es: 'No se pudo anadir el equipo', en: 'The team could not be added' },
  'No se pudo actualizar el equipo': { es: 'No se pudo actualizar el equipo', en: 'The team could not be updated' },
  'No se pudo eliminar el equipo': { es: 'No se pudo eliminar el equipo', en: 'The team could not be deleted' },
  'Criterio anadido': { es: 'Criterio anadido', en: 'Criterion added' },
  'Criterio actualizado': { es: 'Criterio actualizado', en: 'Criterion updated' },
  'Criterio creado y anadido': { es: 'Criterio creado y anadido', en: 'Criterion created and added' },
  'No se pudo guardar el criterio': { es: 'No se pudo guardar el criterio', en: 'The criterion could not be saved' },
  'No se pudo crear el criterio': { es: 'No se pudo crear el criterio', en: 'The criterion could not be created' },
  'No se pudo eliminar el criterio': { es: 'No se pudo eliminar el criterio', en: 'The criterion could not be deleted' },
  'El peso debe ser mayor que cero': { es: 'El peso debe ser mayor que cero', en: 'Weight must be greater than zero' },
  'Los rangos no pueden ser negativos': { es: 'Los rangos no pueden ser negativos', en: 'Ranges cannot be negative' },
  'El rango minimo no puede ser mayor que el maximo': {
    es: 'El rango minimo no puede ser mayor que el maximo',
    en: 'The minimum range cannot be greater than the maximum',
  },
  'El titulo es obligatorio': { es: 'El titulo es obligatorio', en: 'Title is required' },
  'Calidad tecnica': { es: 'Calidad tecnica', en: 'Technical quality' },
  Presentacion: { es: 'Presentacion', en: 'Presentation' },
  Innovacion: { es: 'Innovacion', en: 'Innovation' },
  Descriptores: { es: 'Descriptores', en: 'Descriptors' },
  'Aspectos de la rubrica': { es: 'Aspectos de la rubrica', en: 'Rubric aspects' },
  'Max. selecciones:': { es: 'Max. selecciones:', en: 'Max. selections:' },
  'Juez anadido': { es: 'Juez anadido', en: 'Judge added' },
  'Juez eliminado': { es: 'Juez eliminado', en: 'Judge deleted' },
  'No se pudo anadir el juez': { es: 'No se pudo anadir el juez', en: 'The judge could not be added' },
  'No se pudo eliminar el juez': { es: 'No se pudo eliminar el juez', en: 'The judge could not be deleted' },
  'Anadir juez': { es: 'Anadir juez', en: 'Add judge' },
  'Correo del juez': { es: 'Correo del juez', en: 'Judge email' },
  'Asignar a encuestas': { es: 'Asignar a encuestas', en: 'Assign to surveys' },
  'Puedes dejarlo sin marcar para anadirlo solo como juez de la competicion.': {
    es: 'Puedes dejarlo sin marcar para anadirlo solo como juez de la competicion.',
    en: 'You can leave this unchecked to add them only as a competition judge.',
  },
  'Votacion principal': { es: 'Votacion principal', en: 'Main vote' },
  'Criterios de evaluacion': { es: 'Criterios de evaluacion', en: 'Evaluation criteria' },
  'Si dejas la apertura vacia, la encuesta se abre al crearla. Guardar borrador no activa ni programa la encuesta.': {
    es: 'Si dejas la apertura vacia, la encuesta se abre al crearla. Guardar borrador no activa ni programa la encuesta.',
    en: 'If you leave the opening time empty, the survey opens when it is created. Saving a draft does not activate or schedule the survey.',
  },
  'Borrador guardado': { es: 'Borrador guardado', en: 'Draft saved' },
  'Encuesta programada': { es: 'Encuesta programada', en: 'Survey scheduled' },
  'Encuesta abierta': { es: 'Encuesta abierta', en: 'Survey open' },
  'Encuesta reabierta': { es: 'Encuesta reabierta', en: 'Survey reopened' },
  'Encuesta eliminada': { es: 'Encuesta eliminada', en: 'Survey deleted' },
  'No se pudo crear la encuesta': { es: 'No se pudo crear la encuesta', en: 'The survey could not be created' },
  'No se pudo eliminar la encuesta': { es: 'No se pudo eliminar la encuesta', en: 'The survey could not be deleted' },
  'No se pudo cambiar el estado': { es: 'No se pudo cambiar el estado', en: 'The state could not be changed' },
  'No se pudo reabrir la encuesta': { es: 'No se pudo reabrir la encuesta', en: 'The survey could not be reopened' },
  'No se pudo guardar el horario': { es: 'No se pudo guardar el horario', en: 'The schedule could not be saved' },
  'No se pudo recalcular el ranking': { es: 'No se pudo recalcular el ranking', en: 'The ranking could not be recalculated' },
  'Ranking recalculado': { es: 'Ranking recalculado', en: 'Ranking recalculated' },
  'No se pudo guardar el puntaje': { es: 'No se pudo guardar el puntaje', en: 'The score could not be saved' },
  'Puntaje guardado': { es: 'Puntaje guardado', en: 'Score saved' },
  'Asignaciones actualizadas': { es: 'Asignaciones actualizadas', en: 'Assignments updated' },
  'La encuesta debe tener al menos un equipo asignado': {
    es: 'La encuesta debe tener al menos un equipo asignado',
    en: 'The survey must have at least one assigned team',
  },
  'No hay resultados aun. Haz clic en "Calcular resultados".': {
    es: 'No hay resultados aun. Haz clic en "Calcular resultados".',
    en: 'No results yet. Click "Calculate results".',
  },
  'No hay comentarios aun': { es: 'No hay comentarios aun', en: 'No comments yet' },
  'No hay criterios asignados a esta encuesta': {
    es: 'No hay criterios asignados a esta encuesta',
    en: 'No criteria assigned to this survey',
  },
  'Elige que equipos participan y que jurados pueden votar.': {
    es: 'Elige que equipos participan y que jurados pueden votar.',
    en: 'Choose which teams participate and which judges can vote.',
  },
  'Elige que equipos participan en la votacion publica.': {
    es: 'Elige que equipos participan en la votacion publica.',
    en: 'Choose which teams participate in the public vote.',
  },
  'No hay equipos en la competicion': { es: 'No hay equipos en la competicion', en: 'No teams in the competition' },
  'No hay jurado asignado a la competicion': {
    es: 'No hay jurado asignado a la competicion',
    en: 'No judges assigned to the competition',
  },
  'Deja vacio para abrir ahora sin cierre automatico. Con apertura futura, queda programada hasta esa hora.': {
    es: 'Deja vacio para abrir ahora sin cierre automatico. Con apertura futura, queda programada hasta esa hora.',
    en: 'Leave it empty to open now without automatic closing. With a future opening time, it stays scheduled until then.',
  },
  'La hora de apertura no es valida.': { es: 'La hora de apertura no es valida.', en: 'The opening time is not valid.' },
  'La hora de cierre no es valida.': { es: 'La hora de cierre no es valida.', en: 'The closing time is not valid.' },
  'La hora de apertura debe ser futura. Dejala vacia si quieres abrir ahora.': {
    es: 'La hora de apertura debe ser futura. Dejala vacia si quieres abrir ahora.',
    en: 'The opening time must be in the future. Leave it empty if you want to open now.',
  },
  'La hora de cierre debe ser posterior a la apertura.': {
    es: 'La hora de cierre debe ser posterior a la apertura.',
    en: 'The closing time must be after the opening time.',
  },
  'Esta votacion no esta abierta': { es: 'Esta votacion no esta abierta', en: 'This vote is not open' },
  'No se pudo buscar la sala': { es: 'No se pudo buscar la sala', en: 'The room could not be found' },
  'Sala no disponible': { es: 'Sala no disponible', en: 'Room unavailable' },
  'No se pudo verificar tu registro. Intentalo de nuevo.': {
    es: 'No se pudo verificar tu registro. Intentalo de nuevo.',
    en: 'Your registration could not be verified. Try again.',
  },
  'Correo invalido': { es: 'Correo invalido', en: 'Invalid email' },
  'La contrasena es obligatoria': { es: 'La contrasena es obligatoria', en: 'Password is required' },
  'Minimo 6 caracteres': { es: 'Minimo 6 caracteres', en: 'Minimum 6 characters' },
  'El correo es obligatorio': { es: 'El correo es obligatorio', en: 'Email is required' },
  'El nombre es obligatorio': { es: 'El nombre es obligatorio', en: 'Name is required' },
  'Registro exitoso. Revisa tu correo para confirmar tu cuenta.': {
    es: 'Registro exitoso. Revisa tu correo para confirmar tu cuenta.',
    en: 'Registration successful. Check your email to confirm your account.',
  },
  'No se pudo iniciar sesion': { es: 'No se pudo iniciar sesion', en: 'Could not sign in' },
  'No tienes permisos de administrador': { es: 'No tienes permisos de administrador', en: 'You do not have administrator permissions' },
  'No tienes permisos de juez': { es: 'No tienes permisos de juez', en: 'You do not have judge permissions' },
  'No tienes permisos de participante': { es: 'No tienes permisos de participante', en: 'You do not have participant permissions' },
  'Gracias por participar!': { es: 'Gracias por participar!', en: 'Thanks for participating!' },
  'Tu voto ha sido registrado correctamente.': {
    es: 'Tu voto ha sido registrado correctamente.',
    en: 'Your vote has been recorded successfully.',
  },
  'Completa todos los aspectos de las rubricas': {
    es: 'Completa todos los aspectos de las rubricas',
    en: 'Complete all rubric aspects',
  },
  'No se pudo cargar el formulario de votacion': {
    es: 'No se pudo cargar el formulario de votacion',
    en: 'The voting form could not be loaded',
  },
  'No se pudo enviar el voto': { es: 'No se pudo enviar el voto', en: 'The vote could not be submitted' },
  'Voto registrado': { es: 'Voto registrado', en: 'Vote recorded' },
  'Ya has votado este proyecto': { es: 'Ya has votado este proyecto', en: 'You have already voted for this project' },
  'No se pudo cargar el formulario': { es: 'No se pudo cargar el formulario', en: 'The form could not be loaded' },
  'Selecciona una opcion': { es: 'Selecciona una opcion', en: 'Select an option' },
  'Completa todos los aspectos': { es: 'Completa todos los aspectos', en: 'Complete all aspects' },
  'Valor numerico': { es: 'Valor numerico', en: 'Numeric value' },
  'Enviar evaluacion': { es: 'Enviar evaluacion', en: 'Submit evaluation' },
  'No se pudieron cargar tus encuestas': {
    es: 'No se pudieron cargar tus encuestas',
    en: 'Your surveys could not be loaded',
  },
  'Acaba de abrirse - ya puedes votar': {
    es: 'Acaba de abrirse - ya puedes votar',
    en: 'Just opened - you can vote now',
  },
  'Cierra en menos de 5 minutos': { es: 'Cierra en menos de 5 minutos', en: 'Closes in less than 5 minutes' },
  'sin evaluar': { es: 'sin evaluar', en: 'not evaluated' },
  'No hay encuestas abiertas asignadas': {
    es: 'No hay encuestas abiertas asignadas',
    en: 'No open assigned surveys',
  },
  'El organizador debe asignarte a una encuesta': {
    es: 'El organizador debe asignarte a una encuesta',
    en: 'The organizer must assign you to a survey',
  },
  'Los proyectos se cargaran desde el formulario de votacion.': {
    es: 'Los proyectos se cargaran desde el formulario de votacion.',
    en: 'Projects will be loaded from the voting form.',
  },
  'No se pudo cargar el participante': { es: 'No se pudo cargar el participante', en: 'The participant could not be loaded' },
  'Nombre y correo son obligatorios': { es: 'Nombre y correo son obligatorios', en: 'Name and email are required' },
  'Participante actualizado': { es: 'Participante actualizado', en: 'Participant updated' },
  'No se pudo guardar': { es: 'No se pudo guardar', en: 'Could not save' },
  'Encuesta no encontrada': { es: 'Encuesta no encontrada', en: 'Survey not found' },
  Awards: { es: 'Premios', en: 'Awards' },
  'Event awards': { es: 'Premios del evento', en: 'Event awards' },
  'Competition awards': { es: 'Premios por competicion', en: 'Competition awards' },
  'General prizes associated with the whole event.': {
    es: 'Premios generales asociados a todo el evento.',
    en: 'General prizes associated with the whole event.',
  },
  'Define specific prizes for each category or competition.': {
    es: 'Define premios especificos para cada categoria o competicion.',
    en: 'Define specific prizes for each category or competition.',
  },
  'Create a competition before assigning competition awards.': {
    es: 'Crea una competicion antes de asignar premios de competicion.',
    en: 'Create a competition before assigning competition awards.',
  },
  'Awards for this competition.': { es: 'Premios para esta competicion.', en: 'Awards for this competition.' },
  'Add award': { es: 'Anadir premio', en: 'Add award' },
  'Loading awards...': { es: 'Cargando premios...', en: 'Loading awards...' },
  'No awards yet': { es: 'No hay premios aun', en: 'No awards yet' },
  'Define what each position receives and the delivery conditions.': {
    es: 'Define que recibe cada posicion y las condiciones de entrega.',
    en: 'Define what each position receives and the delivery conditions.',
  },
  Trophy: { es: 'Trofeo', en: 'Trophy' },
  Cash: { es: 'Economico', en: 'Cash' },
  Recognition: { es: 'Reconocimiento', en: 'Recognition' },
  Sponsor: { es: 'Patrocinador', en: 'Sponsor' },
  Other: { es: 'Otro', en: 'Other' },
  Position: { es: 'Posicion', en: 'Position' },
  Type: { es: 'Tipo', en: 'Type' },
  'Description *': { es: 'Descripcion *', en: 'Description *' },
  'Delivery conditions': { es: 'Condiciones de entrega', en: 'Delivery conditions' },
  'Edit award': { es: 'Editar premio', en: 'Edit award' },
  'New award': { es: 'Nuevo premio', en: 'New award' },
  'Save award': { es: 'Guardar premio', en: 'Save award' },
  'Premio creado': { es: 'Premio creado', en: 'Award created' },
  'Premio actualizado': { es: 'Premio actualizado', en: 'Award updated' },
  'Premio eliminado': { es: 'Premio eliminado', en: 'Award deleted' },
  'No se pudieron cargar los premios': { es: 'No se pudieron cargar los premios', en: 'Awards could not be loaded' },
  'Generar certificados top 3': { es: 'Generar certificados top 3', en: 'Generate top 3 certificates' },
  'Calcula el ranking antes de generar certificados': {
    es: 'Calcula el ranking antes de generar certificados',
    en: 'Calculate the ranking before generating certificates',
  },
  'Certificados generados': { es: 'Certificados generados', en: 'Certificates generated' },
  'Necesitas al menos 3 resultados para generar los certificados del top 3': {
    es: 'Necesitas al menos 3 resultados para generar los certificados del top 3',
    en: 'You need at least 3 results to generate the top 3 certificates',
  },
  'Se han generado 3 certificados independientes': {
    es: 'Se han generado 3 certificados independientes',
    en: '3 separate certificates have been generated',
  },
  'Solo puedes generar certificados cuando la encuesta esta cerrada': {
    es: 'Solo puedes generar certificados cuando la encuesta esta cerrada',
    en: 'You can only generate certificates when the survey is closed',
  },
  'Certificado generado': { es: 'Certificado generado', en: 'Certificate generated' },
  Certificado: { es: 'Certificado', en: 'Certificate' },
  'Generar certificado': { es: 'Generar certificado', en: 'Generate certificate' },
  'Disponible cuando la encuesta este cerrada': {
    es: 'Disponible cuando la encuesta este cerrada',
    en: 'Available when the survey is closed',
  },
  'Define los premios de esta competicion, la posicion que los recibe y sus condiciones de entrega.': {
    es: 'Define los premios de esta competicion, la posicion que los recibe y sus condiciones de entrega.',
    en: 'Define this competition awards, the position that receives them, and their delivery conditions.',
  },
  'No se pudo conectar con el servidor. Comprueba que el backend este iniciado.': {
    es: 'No se pudo conectar con el servidor. Comprueba que el backend este iniciado.',
    en: 'Could not connect to the server. Check that the backend is running.',
  },
  'Revisa los datos e intentalo de nuevo.': {
    es: 'Revisa los datos e intentalo de nuevo.',
    en: 'Check the data and try again.',
  },
  'No tienes permisos para hacer esta accion.': {
    es: 'No tienes permisos para hacer esta accion.',
    en: 'You do not have permission to perform this action.',
  },
  'No se encontro el recurso solicitado.': {
    es: 'No se encontro el recurso solicitado.',
    en: 'The requested resource was not found.',
  },
  'No se pudo completar la accion. Intentalo de nuevo mas tarde.': {
    es: 'No se pudo completar la accion. Intentalo de nuevo mas tarde.',
    en: 'The action could not be completed. Try again later.',
  },
  'No se pudo completar la accion.': {
    es: 'No se pudo completar la accion.',
    en: 'The action could not be completed.',
  },
  'Revisa los campos obligatorios y los valores introducidos.': {
    es: 'Revisa los campos obligatorios y los valores introducidos.',
    en: 'Check the required fields and entered values.',
  },
  'Ya existe un registro con esos datos': {
    es: 'Ya existe un registro con esos datos',
    en: 'A record with that data already exists',
  },
  'No se puede borrar porque hay datos relacionados': {
    es: 'No se puede borrar porque hay datos relacionados',
    en: 'It cannot be deleted because related data exists',
  },
  'Hay un valor numerico no valido.': {
    es: 'Hay un valor numerico no valido.',
    en: 'There is an invalid numeric value.',
  },
  Abre: { es: 'Abre', en: 'Opens' },
  Reabierta: { es: 'Reabierta', en: 'Reopened' },
  'La hora de cierre debe ser futura.': { es: 'La hora de cierre debe ser futura.', en: 'The closing time must be in the future.' },
  'El cierre debe ser posterior a la apertura.': {
    es: 'El cierre debe ser posterior a la apertura.',
    en: 'Closing must be after opening.',
  },
};

const mojibakeReplacements: Array<[RegExp, string]> = [
  [/ﾃ｡/g, 'a'],
  [/ﾃｩ/g, 'e'],
  [/ﾃｭ/g, 'i'],
  [/ﾃｳ/g, 'o'],
  [/ﾃｺ/g, 'u'],
  [/ﾃｱ/g, 'n'],
  [/ﾂｿ/g, ''],
  [/ﾂ｡/g, ''],
  [/ﾂｷ/g, '·'],
  [/窶・/g, '-'],
  [/竊・/g, ''],
  [/笨・/g, ''],
  [/･・/g, ''],
];

function normalizeSource(text: string) {
  return mojibakeReplacements
    .reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text)
    .replace(/[¿¡]/g, '')
    .replace(/[←→]/g, '')
    .replace(/[—–]/g, '-')
    .replace(/·/g, '-')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function translatePatterns(text: string, language: Language): string {
  const from = normalizeSource(text);
  const fromLower = from.toLocaleLowerCase();
  const word = (key: string) => exact[key]?.[language] ?? key;
  const direct = Object.entries(exact).find(([key, entry]) =>
    [key, entry.es, entry.en].some((value) => normalizeSource(value).toLocaleLowerCase() === fromLower)
  )?.[1];
  if (direct) return direct[language];

  const reverse = Object.values(exact).find(
    (entry) => normalizeSource(entry.es).toLocaleLowerCase() === fromLower || normalizeSource(entry.en).toLocaleLowerCase() === fromLower
  );
  if (reverse) return reverse[language];

  if (/^Entrar como (.+)$/.test(from)) {
    return from.replace(/^Entrar como (.+)$/, (_, role) => `${language === 'en' ? 'Sign in as' : 'Entrar como'} ${translateToken(role, language).toLowerCase()}`);
  }
  if (/^Competicion (\d+)$/.test(from)) return from.replace(/^Competicion/, word('Competicion'));
  if (/^Aspecto (\d+)$/.test(from)) return from.replace(/^Aspecto/, word('Aspecto'));
  if (/^Opcion (\d+)$/.test(from)) return from.replace(/^Opcion/, word('Opcion'));
  if (/^Proyecto (\d+)$/.test(from)) return from.replace(/^Proyecto/, word('Proyecto'));
  if (/^Position (\d+)$/.test(from)) return language === 'es' ? from.replace(/^Position/, 'Posicion') : from;
  if (/^(\d+) votos$/.test(from)) return from.replace('votos', language === 'en' ? 'votes' : 'votos');
  if (/^(\d+) pendiente(s)?$/.test(from)) {
    const count = Number(from.match(/^(\d+)/)?.[1] ?? 0);
    return language === 'en' ? `${count} pending` : `${count} pendiente${count === 1 ? '' : 's'}`;
  }
  if (/^Maximo (.+) selecciones/.test(from)) {
    return language === 'en'
      ? from.replace(/^Maximo/, 'Maximum').replace('selecciones', 'selections')
      : from;
  }
  if (/^Asignado (.+) de (.+)$/.test(from)) return language === 'en' ? from.replace(/^Asignado/, 'Assigned').replace(' de ', ' of ') : from;
  if (/^peso: (.+)$/.test(from)) return language === 'en' ? from.replace(/^peso:/, 'weight:') : from;
  if (/^Evaluando:/.test(from)) return language === 'en' ? from.replace(/^Evaluando:/, 'Evaluating:') : from;
  if (/^No hay (.+) aun\.?$/.test(from)) {
    const item = from.replace(/^No hay /, '').replace(/ aun\.?$/, '');
    return language === 'en' ? `No ${translateNounPhrase(item, language)} yet` : from;
  }
  if (/^Anadir (.+)$/.test(from)) {
    const item = from.replace(/^Anadir /, '');
    return language === 'en' ? `Add ${translateNounPhrase(item, language)}` : from;
  }
  if (/^Eliminar (.+)$/.test(from)) {
    const item = from.replace(/^Eliminar /, '');
    return language === 'en' ? `Delete ${translateNounPhrase(item, language)}` : from;
  }
  if (/^Guardar (.+)$/.test(from)) {
    const item = from.replace(/^Guardar /, '');
    return language === 'en' ? `Save ${translateNounPhrase(item, language)}` : from;
  }
  if (/^No se pudo (.+)$/.test(from)) {
    const action = from.replace(/^No se pudo /, '');
    return language === 'en' ? `Could not ${translateActionPhrase(action)}` : from;
  }
  if (/^No se pudieron (.+)$/.test(from)) {
    const action = from.replace(/^No se pudieron /, '');
    return language === 'en' ? `Could not ${translateActionPhrase(action)}` : from;
  }

  return from;
}

function translateNounPhrase(text: string, language: Language): string {
  if (language === 'es') return text;
  return text
    .replace(/\beventos\b/g, 'events')
    .replace(/\bevento\b/g, 'event')
    .replace(/\bcompeticiones\b/g, 'competitions')
    .replace(/\bcompeticion\b/g, 'competition')
    .replace(/\bequipos\b/g, 'teams')
    .replace(/\bequipo\b/g, 'team')
    .replace(/\bcriterios\b/g, 'criteria')
    .replace(/\bcriterio\b/g, 'criterion')
    .replace(/\bencuestas\b/g, 'surveys')
    .replace(/\bencuesta\b/g, 'survey')
    .replace(/\bjueces\b/g, 'judges')
    .replace(/\bjuez\b/g, 'judge')
    .replace(/\bjurado\b/g, 'judges')
    .replace(/\bparticipantes\b/g, 'participants')
    .replace(/\bparticipante\b/g, 'participant')
    .replace(/\bresultados\b/g, 'results')
    .replace(/\bcomentarios\b/g, 'comments')
    .replace(/\basignaciones\b/g, 'assignments')
    .replace(/\bproyecto\b/g, 'project')
    .replace(/\bproyectos\b/g, 'projects')
    .replace(/\bimagen\b/g, 'image')
    .replace(/\bpuntaje\b/g, 'score')
    .replace(/\bhorario\b/g, 'schedule')
    .replace(/\bformulario\b/g, 'form');
}

function translateActionPhrase(text: string): string {
  return text
    .replace(/^cargar /, 'load ')
    .replace(/^guardar /, 'save ')
    .replace(/^crear /, 'create ')
    .replace(/^anadir /, 'add ')
    .replace(/^eliminar /, 'delete ')
    .replace(/^actualizar /, 'update ')
    .replace(/^subir /, 'upload ')
    .replace(/^enviar /, 'submit ')
    .replace(/^buscar /, 'find ')
    .replace(/^verificar /, 'verify ')
    .replace(/^recalcular /, 'recalculate ')
    .replace(/^reabrir /, 'reopen ')
    .replace(/^completar /, 'complete ')
    .replace(/\blos cambios\b/g, 'the changes')
    .replace(/\blas asignaciones\b/g, 'assignments')
    .replace(/\blos resultados\b/g, 'results')
    .replace(/\blos datos\b/g, 'data')
    .replace(/\bla sala\b/g, 'the room')
    .replace(/\bla imagen\b/g, 'the image')
    .replace(/\bel evento\b/g, 'the event')
    .replace(/\bla competicion\b/g, 'the competition')
    .replace(/\bel equipo\b/g, 'the team')
    .replace(/\bel criterio\b/g, 'the criterion')
    .replace(/\bla encuesta\b/g, 'the survey')
    .replace(/\bel juez\b/g, 'the judge')
    .replace(/\bel voto\b/g, 'the vote')
    .replace(/\bel formulario de votacion\b/g, 'the voting form')
    .replace(/\bel formulario\b/g, 'the form')
    .replace(/\bel participante\b/g, 'the participant')
    .replace(/\bel puntaje\b/g, 'the score')
    .replace(/\bel horario\b/g, 'the schedule')
    .replace(/\bel ranking\b/g, 'the ranking');
}

export function translateToken(text: string, language: Language): string {
  return translatePatterns(text, language);
}

export function getStoredLanguage(): Language {
  if (typeof localStorage === 'undefined') return 'en';
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === 'es' || stored === 'en' ? stored : 'en';
}

export function translateForCurrentLanguage(text: string): string {
  return translateToken(text, getStoredLanguage());
}

export const translationStrategies: Record<Language, TranslationStrategy> = {
  en: {
    code: 'en',
    label: 'English',
    shortLabel: 'EN',
    locale: 'en-US',
    translate: (text) => translatePatterns(text, 'en'),
  },
  es: {
    code: 'es',
    label: 'Espanol',
    shortLabel: 'ES',
    locale: 'es-ES',
    translate: (text) => translatePatterns(text, 'es'),
  },
};
