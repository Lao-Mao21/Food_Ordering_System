import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../../components/layouts';
import { Button, LoadingSpinner, Icon, ToastProvider } from '../../../components/ui';
import UserService from '../../../services/UserSerivce';
import type { User } from '../../../interfaces/user';
import { notify } from '../../../util/notify';
import { useDateFormatter } from '../../../hooks/index';
import { PATHS } from '../../../routes/path';
import EditUserModal from './EditUserModal';
import DeleteUserModal from './DeleteUserModal';

/* =========================
   DETAIL ROW
========================= */
const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col gap-1 py-3 border-b border-border-muted last:border-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {label}
        </span>
        <span className="text-sm text-text font-medium">
            {value || <span className="text-text-muted italic">—</span>}
        </span>
    </div>
);

/* =========================
   BADGE
========================= */
const RoleBadge = ({ role }: { role: string }) => {
    const isAdmin = role === 'admin';
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isAdmin
                ? 'bg-primary/15 text-primary'
                : 'bg-text-muted/15 text-text-muted'
                }`}
        >
            <Icon iconName={isAdmin ? 'FaShield' : 'FaUser'} size={12} />
            {role}
        </span>
    );
};

/* =========================
   USER DETAIL PAGE
========================= */
const UserDetail = () => {
    const { slug } = useParams<{ slug: string }>(); 
    const navigate = useNavigate();

    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const dateFormat = useDateFormatter();

    /* =========================
       FETCH USER
    ========================= */
    const fetchUser = async () => {
        if (!slug) return;
        setIsLoading(true);
        try {
            const response = await UserService.getOne(slug);
            setUser(response.data?.user ?? response.user ?? null);
        } catch (error) {
            notify.error("Failed to load user details");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [slug]);

    /* =========================
       CONTENT
    ========================= */
    const content = (
        <div className="space-y-6">

            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    iconName="FaArrowLeft"
                    onClick={() => navigate(PATHS.APP.USERS)}
                    className="text-text-muted hover:text-text"
                >
                    Back to Users
                </Button>

                {!isLoading && user && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="primary"
                            iconName="FaPencil"
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            Edit User
                        </Button>
                        <Button
                            variant="danger"
                            iconName="FaTrash"
                            onClick={() => setIsDeleteModalOpen(true)}
                        >
                            Delete
                        </Button>
                    </div>
                )}
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-24">
                    <LoadingSpinner size="md" text="Loading user details..." />
                </div>
            )}

            {/* User Not Found */}
            {!isLoading && !user && (
                <div className="flex flex-col items-center justify-center text-center space-y-4 py-24">
                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-danger/10">
                        <Icon iconName="FaUserSlash" className="text-3xl text-danger" />
                    </div>
                    <h2 className="text-lg font-semibold text-text">User Not Found</h2>
                    <p className="text-sm text-text-muted">
                        The user you're looking for doesn't exist or may have been removed.
                    </p>
                    <Button variant="primary" iconName="FaArrowLeft" onClick={() => navigate(PATHS.APP.USERS)}>
                        Back to Users
                    </Button>
                </div>
            )}

            {/* User Detail Card */}
            {!isLoading && user && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left — Avatar + Quick Info */}
                    <div className="lg:col-span-1">
                        <div className="bg-bg-light border border-border-muted rounded-2xl p-6 flex flex-col items-center text-center gap-4">

                            {/* Avatar */}
                            {user.avatar ? (
                                <img
                                    src={`${import.meta.env.VITE_STORAGE_URL}/${user.avatar}`}
                                    alt={user.name}
                                    className="w-28 h-28 rounded-full object-cover ring-2 ring-primary/30"
                                />
                            ) : (
                                <div className="w-28 h-28 rounded-full bg-primary/15 flex items-center justify-center text-4xl font-bold text-primary">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}

                            {/* Name & Role */}
                            <div className="space-y-1.5">
                                <h2 className="text-lg font-bold text-text">{user.name}</h2>
                                <RoleBadge role={user.role} />
                            </div>

                            {/* Email quick */}
                            <div className="flex items-center gap-2 text-sm text-text-muted">
                                <Icon iconName="FaEnvelope" size={13} />
                                <span>{user.email}</span>
                            </div>

                            {/* Phone quick */}
                            {user.phone && (
                                <div className="flex items-center gap-2 text-sm text-text-muted">
                                    <Icon iconName="FaPhone" size={13} />
                                    <span>{user.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right — Detail Rows */}
                    <div className="lg:col-span-2">
                        <div className="bg-bg-light border border-border-muted rounded-2xl p-6 space-y-0">

                            <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-2 pb-3 border-b border-border-muted">
                                User Information
                            </h3>

                            <DetailRow label="Full Name" value={user.name} />
                            <DetailRow label="Email Address" value={user.email} />
                            <DetailRow label="Phone Number" value={user.phone} />
                            <DetailRow label="Role" value={<RoleBadge role={user.role} />} />
                            <DetailRow label="Theme Preference" value={
                                <span className="capitalize">{user.theme}</span>
                            } />
                            <DetailRow
                                label="Account Created"
                                value={dateFormat.dateTime(user.created_at)}
                            />
                            <DetailRow
                                label="Last Updated"
                                value={dateFormat.dateTime(user.updated_at)}
                            />
                        </div>
                    </div>

                </div>
            )}

            <EditUserModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    fetchUser();
                }}
                user={user}
                onSuccess={() => {
                    fetchUser();
                }}
            />

            <DeleteUserModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                user={user}
                onSuccess={() => navigate(PATHS.APP.USERS)}
            />

            <ToastProvider />
        </div>
    );

    return <MainLayout content={content} />;
};

export default UserDetail;
