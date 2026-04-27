import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';
import { votifyApi } from '../../shared/facade/VotifyApiFacade';

type LoginForm = {
  nombre?: string;
  correo: string;
  contrasena: string;
};

export function LoginPage() {
  const [isRegistro, setIsRegistro] = useState(false);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  const { userId, setSession } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  // Si ya hay sesión activa al entrar a /login, resolvemos el rol del
  // usuario contra el backend (`/auth/me`) y le mandamos a su panel.
  // El backend determina el rol: admin si tiene eventos como organizador,
  // juez en caso contrario (`UserRoleService.resolveRole`).
  useEffect(() => {
    if (!userId) return;
    votifyApi.me(userId)
      .then((data: any) => {
        const destino = data?.rol === 'juez' ? '/juez' : '/admin';
        navigate(destino, { replace: true });
      })
      .catch(() => undefined);
  }, [userId, navigate]);

  async function onSubmit(data: LoginForm) {
    setCargando(true);
    try {
      if (isRegistro) {
        await votifyApi.register({
          nombre: data.nombre ?? '',
          correo: data.correo,
          password: data.contrasena
        });
        toast.success('Registro exitoso. Revisa tu correo para confirmar tu cuenta.');
      } else {
        const response: any = await votifyApi.login({
          correo: data.correo,
          password: data.contrasena
        });
        const id = response.user?.id ?? response.session?.user?.id;
        if (id) {
          setSession({ userId: id, perfil: response.perfil, rol: response.rol });
          navigate(response.rol === 'juez' ? '/juez' : '/admin', { replace: true });
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md w-full max-w-sm p-8">
        <Link to="/acceso" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-5 transition-colors">
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">Votify</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          {isRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isRegistro && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                {...register('nombre', { required: 'El nombre es obligatorio' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Tu nombre"
              />
              {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input
              {...register('correo', {
                required: 'El correo es obligatorio',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Correo inválido' }
              })}
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="correo@ejemplo.com"
            />
            {errors.correo && <p className="text-red-500 text-xs mt-1">{errors.correo.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              {...register('contrasena', {
                required: 'La contraseña es obligatoria',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' }
              })}
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
            {errors.contrasena && <p className="text-red-500 text-xs mt-1">{errors.contrasena.message}</p>}
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {cargando ? 'Cargando...' : isRegistro ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {isRegistro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
          <button className="text-indigo-600 font-medium hover:underline" onClick={() => setIsRegistro(!isRegistro)}>
            {isRegistro ? 'Iniciar sesión' : 'Registrarse'}
          </button>
        </p>
      </div>
    </div>
  );
}
