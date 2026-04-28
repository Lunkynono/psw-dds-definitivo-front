import { Vote } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl shadow-lg mb-4">
            <Vote size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Votify</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isRegistro ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 p-8 border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isRegistro && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
                <input
                  {...register('nombre', { required: 'El nombre es obligatorio' })}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                  placeholder="Tu nombre completo"
                />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
              <input
                {...register('correo', {
                  required: 'El correo es obligatorio',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Correo inválido' }
                })}
                type="email"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                placeholder="correo@ejemplo.com"
              />
              {errors.correo && <p className="text-red-500 text-xs mt-1">{errors.correo.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <input
                {...register('contrasena', {
                  required: 'La contraseña es obligatoria',
                  minLength: { value: 6, message: 'Mínimo 6 caracteres' }
                })}
                type="password"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                placeholder="••••••••"
              />
              {errors.contrasena && <p className="text-red-500 text-xs mt-1">{errors.contrasena.message}</p>}
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm shadow-indigo-200 mt-2"
            >
              {cargando ? 'Cargando...' : isRegistro ? 'Crear cuenta' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            {isRegistro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
            <button className="text-indigo-600 font-semibold hover:underline" onClick={() => setIsRegistro(!isRegistro)}>
              {isRegistro ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          </p>
        </div>

        <div className="text-center mt-6">
          <Link to="/acceso" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
