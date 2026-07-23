import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const DashboardRedirect = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (['ADMIN', 'SUPER_ADMIN', 'DEPT_ADMIN'].includes(user.role)) {
                    navigate('/admin/dashboard', { replace: true });
                } else if (user.role === 'TEACHER') {
                    navigate('/teacher/dashboard', { replace: true });
                } else {
                    navigate('/student/dashboard', { replace: true });
                }
            } catch (e) {
                navigate('/login', { replace: true });
            }
        } else {
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary-500" size={40} />
        </div>
    );
};

export default DashboardRedirect;
