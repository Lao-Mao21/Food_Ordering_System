import { useState } from "react";
import Modal from "../../../components/ui/Modal";
import { notify } from "../../../util/notify";
import UserService from "../../../services/UserSerivce";
import type { User } from "../../../interfaces/user";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isPermanentDelete?: boolean;
  onSuccess?: () => void;
};

const DeleteUserModal = ({ isOpen, onClose, user, isPermanentDelete = false, onSuccess }: Props) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      await UserService.delete(user.id);
      const deleteType = isPermanentDelete ? 'permanently' : 'moved to trash';
      notify.success(`User ${deleteType} successfully!`);
      onSuccess?.();
      onClose();
    } catch (error) {
      notify.error("Failed to delete user");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isPermanentDelete ? 'Permanently Delete User' : 'Delete User'}
      size="sm"
      primaryAction={{
        label: 'Delete',
        onClick: handleConfirmDelete,
        variant: 'danger',
        isLoading: isDeleting,
        loadingText: 'Deleting...'
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: onClose,
        variant: 'secondary',
      }}
    >
      <div className="space-y-3">
        <p className="text-sm text-text">
          {isPermanentDelete
            ? `Are you sure you want to permanently delete ${user?.name}? This action cannot be undone.`
            : `Are you sure you want to delete ${user?.name}? They can be recovered from the deleted users section.`}
        </p>
        {user && (
          <div className="bg-bg-light rounded-lg p-3 space-y-2 text-sm">
            <div><span className="font-semibold text-text-muted">Email:</span> {user.email}</div>
            <div><span className="font-semibold text-text-muted">Role:</span> <span className="capitalize">{user.role}</span></div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DeleteUserModal;
