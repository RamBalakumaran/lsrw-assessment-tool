import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import api from '../utils/api';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const [checkingSession, setCheckingSession] = useState(Boolean(token));
    const [sessionInvalid, setSessionInvalid] = useState(false);

    useEffect(() => {
        let isActive = true;

        const syncSession = async () => {
            if (!token) {
                if (isActive) {
                    setCheckingSession(false);
                }
                return;
            }

            try {
                const res = await api.get('/auth/me');
                const nextUser = res.data?.user;

                if (!isActive || !nextUser) {
                    return;
                }

                localStorage.setItem('user', JSON.stringify(nextUser));
                if (nextUser.organizationId) {
                    localStorage.setItem('organizationId', nextUser.organizationId);
                }
            } catch (error) {
                if (!isActive) {
                    return;
                }

                const statusCode = error?.response?.status;
                if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
                    localStorage.clear();
                    setSessionInvalid(true);
                }
            } finally {
                if (isActive) {
                    setCheckingSession(false);
                }
            }
        };

        syncSession();

        return () => {
            isActive = false;
        };
    }, [token]);

    if (!token || sessionInvalid) {
        return <Navigate to="/login" replace />;
    }

    if (checkingSession) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary-500" size={40} />
            </div>
        );
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;
