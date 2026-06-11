import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import {
    Building2,
    CheckCircle2,
    Globe2,
    Layers,
    Loader2,
    PencilLine,
    Plus,
    Search,
    Shield,
    Users,
    X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const ORGANIZATION_STATUS_OPTIONS = ['ACTIVE', 'INACTIVE'];

const emptyOrganizationForm = () => ({
    id: null,
    name: '',
    subdomain: '',
    status: 'ACTIVE',
});

const readStoredUser = () => {
    try {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
        return null;
    }
};

const statusBadgeClass = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    INACTIVE: 'bg-gray-50 text-gray-600 border-gray-100',
};

const OrganizationManagement = () => {
    const currentUser = readStoredUser();
    const canManageOrganizations = currentUser?.role === 'SUPER_ADMIN';
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [organizationForm, setOrganizationForm] = useState(emptyOrganizationForm());

    const fetchOrganizations = async (selectedId) => {
        try {
            const res = await api.get('/admin/organizations');
            const nextOrganizations = Array.isArray(res.data) ? res.data : [];
            setOrganizations(nextOrganizations);

            const fallbackId = nextOrganizations[0]?.id || null;
            setSelectedOrganizationId((current) => {
                const preferredId = selectedId === undefined ? current : selectedId;
                if (preferredId && nextOrganizations.some((organization) => organization.id === preferredId)) {
                    return preferredId;
                }
                return fallbackId;
            });
        } catch (error) {
            console.error('Failed to fetch organizations:', error);
            setOrganizations([]);
            setSelectedOrganizationId(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const filteredOrganizations = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();
        return organizations.filter((organization) => {
            if (!normalizedSearch) {
                return true;
            }

            return [
                organization.name,
                organization.subdomain,
                organization.organizationAdmins?.map((admin) => admin.profileName).join(' '),
            ]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(normalizedSearch));
        });
    }, [organizations, searchQuery]);

    const selectedOrganization = useMemo(() => {
        return filteredOrganizations.find((organization) => organization.id === selectedOrganizationId)
            || organizations.find((organization) => organization.id === selectedOrganizationId)
            || null;
    }, [filteredOrganizations, organizations, selectedOrganizationId]);

    useEffect(() => {
        if (!filteredOrganizations.length) {
            setSelectedOrganizationId(null);
            return;
        }

        if (!selectedOrganizationId || !filteredOrganizations.some((organization) => organization.id === selectedOrganizationId)) {
            setSelectedOrganizationId(filteredOrganizations[0].id);
        }
    }, [filteredOrganizations, selectedOrganizationId]);

    const summaryCards = [
        { label: 'Organizations', value: organizations.length },
        { label: 'Organization Admins', value: organizations.reduce((sum, organization) => sum + (organization.admins || 0), 0) },
        { label: 'Department Admins', value: organizations.reduce((sum, organization) => sum + (organization.deptAdmins || 0), 0) },
        { label: 'Teachers', value: organizations.reduce((sum, organization) => sum + (organization.teachers || 0), 0) },
        { label: 'Students', value: organizations.reduce((sum, organization) => sum + (organization.students || 0), 0) },
    ];

    const openCreateModal = () => {
        setOrganizationForm(emptyOrganizationForm());
        setShowFormModal(true);
    };

    const openEditModal = (organization) => {
        setOrganizationForm({
            id: organization.id,
            name: organization.name,
            subdomain: organization.subdomain,
            status: organization.status || 'ACTIVE',
        });
        setShowFormModal(true);
    };

    const handleSaveOrganization = async (event) => {
        event.preventDefault();
        setSaving(true);

        try {
            const payload = {
                name: organizationForm.name.trim(),
                subdomain: organizationForm.subdomain.trim(),
                status: organizationForm.status,
            };

            if (!payload.name || !payload.subdomain) {
                alert('Organization name and subdomain are required.');
                setSaving(false);
                return;
            }

            if (organizationForm.id) {
                await api.patch(`/admin/organizations/${organizationForm.id}`, payload);
                await fetchOrganizations(organizationForm.id);
            } else {
                const res = await api.post('/admin/organizations', payload);
                await fetchOrganizations(res.data?.id);
            }

            setShowFormModal(false);
            setOrganizationForm(emptyOrganizationForm());
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to save organization');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex bg-gray-50 min-h-screen">
                <Sidebar role={currentUser?.role || 'ADMIN'} />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary-500" size={48} />
                </main>
            </div>
        );
    }

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar role={currentUser?.role || 'ADMIN'} />

            <main className="flex-1 p-10 overflow-y-auto">
                <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Organization Control</h1>
                        <p className="text-gray-500 font-medium">
                            {canManageOrganizations
                                ? 'Create organizations, keep them active or inactive, and review assigned admins.'
                                : 'Review your organization profile, department footprint, and assigned administrators.'}
                        </p>
                    </div>

                    {canManageOrganizations && (
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition shadow-lg"
                        >
                            <Plus size={18} />
                            <span>Create Organization</span>
                        </button>
                    )}
                </header>

                <section className="grid md:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
                    {summaryCards.map((card) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm"
                        >
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{card.label}</div>
                            <div className="text-3xl font-black text-gray-900">{card.value}</div>
                        </motion.div>
                    ))}
                </section>

                <section className="grid xl:grid-cols-[420px_minmax(0,1fr)] gap-8 items-start">
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search organizations, subdomains, or admins..."
                                    className="w-full pl-12 pr-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {filteredOrganizations.map((organization) => (
                                <button
                                    key={organization.id}
                                    type="button"
                                    onClick={() => setSelectedOrganizationId(organization.id)}
                                    className={`w-full text-left bg-white rounded-[2rem] border px-6 py-5 shadow-sm transition-all ${selectedOrganizationId === organization.id
                                        ? 'border-primary-500 shadow-lg shadow-primary-500/10'
                                        : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
                                                <Building2 size={22} />
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-gray-900">{organization.name}</div>
                                                <div className="text-sm text-gray-500 font-medium mt-1">{organization.subdomain}.fluentpro</div>
                                                <div className="text-sm text-gray-400 font-medium mt-2">
                                                    {organization.totalUsers} users across {organization.departmentCount} departments
                                                </div>
                                            </div>
                                        </div>

                                        <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusBadgeClass[organization.status] || statusBadgeClass.ACTIVE}`}>
                                            {organization.status}
                                        </span>
                                    </div>
                                </button>
                            ))}

                            {filteredOrganizations.length === 0 && (
                                <div className="bg-white rounded-[2rem] border border-dashed border-gray-200 px-6 py-12 text-center text-gray-500 font-medium">
                                    No organizations match this search yet.
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        {!selectedOrganization ? (
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10 text-center text-gray-500 font-medium">
                                Select an organization card to review its essential details.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                                        <div>
                                            <div className="text-3xl font-black text-gray-900">{selectedOrganization.name}</div>
                                            <div className="flex items-center gap-2 text-gray-500 font-medium mt-2">
                                                <Globe2 size={16} />
                                                <span>{selectedOrganization.subdomain}.fluentpro</span>
                                            </div>
                                            <div className="flex flex-wrap gap-3 mt-4">
                                                <span className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusBadgeClass[selectedOrganization.status] || statusBadgeClass.ACTIVE}`}>
                                                    {selectedOrganization.status}
                                                </span>
                                                <span className="px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest bg-sky-50 text-sky-700 border-sky-100">
                                                    {selectedOrganization.departmentCount} Departments
                                                </span>
                                            </div>
                                        </div>

                                        {canManageOrganizations && (
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(selectedOrganization)}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition"
                                            >
                                                <PencilLine size={18} />
                                                <span>Edit Organization</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid lg:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                                        <h2 className="text-2xl font-black text-gray-900 mb-6">Essential Details</h2>
                                        <div className="space-y-4">
                                            <div className="bg-gray-50 rounded-[1.5rem] p-5 border border-gray-100">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                                                    <Building2 size={12} />
                                                    <span>Organization Name</span>
                                                </div>
                                                <div className="text-lg font-black text-gray-900">{selectedOrganization.name}</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-[1.5rem] p-5 border border-gray-100">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                                                    <Globe2 size={12} />
                                                    <span>Subdomain</span>
                                                </div>
                                                <div className="text-lg font-black text-gray-900">{selectedOrganization.subdomain}</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-[1.5rem] p-5 border border-gray-100">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                                                    <CheckCircle2 size={12} />
                                                    <span>Status</span>
                                                </div>
                                                <div className="text-lg font-black text-gray-900">{selectedOrganization.status}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                                        <h2 className="text-2xl font-black text-gray-900 mb-6">Access Distribution</h2>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {[
                                                { label: 'Organization Admins', value: selectedOrganization.admins, icon: <Shield size={16} /> },
                                                { label: 'Department Admins', value: selectedOrganization.deptAdmins, icon: <Layers size={16} /> },
                                                { label: 'Teachers', value: selectedOrganization.teachers, icon: <Users size={16} /> },
                                                { label: 'Students', value: selectedOrganization.students, icon: <Users size={16} /> },
                                            ].map((item) => (
                                                <div key={item.label} className="bg-gray-50 rounded-[1.5rem] p-5 border border-gray-100">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                                                        {item.icon}
                                                        <span>{item.label}</span>
                                                    </div>
                                                    <div className="text-2xl font-black text-gray-900">{item.value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                                    <h2 className="text-2xl font-black text-gray-900 mb-6">Assigned Organization Admins</h2>

                                    {selectedOrganization.organizationAdmins?.length ? (
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {selectedOrganization.organizationAdmins.map((admin) => (
                                                <div key={admin.id} className="bg-gray-50 rounded-[1.75rem] border border-gray-100 p-5">
                                                    <div className="font-black text-gray-900">{admin.profileName}</div>
                                                    <div className="text-sm text-gray-500 font-medium mt-1">{admin.email}</div>
                                                    <span className={`inline-flex mt-3 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusBadgeClass[admin.status] || statusBadgeClass.ACTIVE}`}>
                                                        {admin.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 rounded-[1.5rem] border border-dashed border-gray-200 px-6 py-10 text-center text-gray-500 font-medium">
                                            No organization admins are assigned yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <AnimatePresence>
                {showFormModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                            onClick={() => setShowFormModal(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 70, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 70, scale: 0.95 }}
                            className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden p-10"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900">
                                        {organizationForm.id ? 'Edit Organization' : 'Create Organization'}
                                    </h2>
                                    <p className="text-gray-500 font-medium">
                                        Define the organization name, subdomain, and availability.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowFormModal(false)}
                                    className="p-2 text-gray-400 hover:text-gray-900 transition"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveOrganization} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Organization Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={organizationForm.name}
                                        onChange={(event) => setOrganizationForm((current) => ({ ...current, name: event.target.value }))}
                                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                                        placeholder="FluentPro University"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Subdomain</label>
                                    <input
                                        type="text"
                                        required
                                        value={organizationForm.subdomain}
                                        onChange={(event) => setOrganizationForm((current) => ({ ...current, subdomain: event.target.value.toLowerCase() }))}
                                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                                        placeholder="fluentpro-university"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Status</label>
                                    <select
                                        value={organizationForm.status}
                                        onChange={(event) => setOrganizationForm((current) => ({ ...current, status: event.target.value }))}
                                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                                    >
                                        {ORGANIZATION_STATUS_OPTIONS.map((status) => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-5 bg-gray-900 text-white rounded-[2rem] font-black text-lg hover:bg-black transition disabled:opacity-60"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                    <span>{organizationForm.id ? 'Save Organization' : 'Create Organization'}</span>
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrganizationManagement;
