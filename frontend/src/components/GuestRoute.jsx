import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function GuestRoute() {
    const token = useAuthStore((state) => state.token);

    return token
        ? <Navigate to="/dashboard" replace />
        : <Outlet />;
}