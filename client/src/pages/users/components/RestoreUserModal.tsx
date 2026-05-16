import { useState } from "react";
import Modal from "../../../components/ui/Modal";
import { notify } from "../../../util/notify";
import UserService from "../../../services/UserSerivce";
import type { User } from "../../../interfaces/user";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess?: () => void;
};

const RestoreUserModal = ({ isOpen, onClose, user, onSuccess }: Props) => {
  const [isRestoring, setIsRestoring] = useState(false);

  const handleConfirmRestore = async () => {
    if (!user) return;

    setIsRestoring(true);
    try {
      await UserService.restore(user.id);
      notify.success("User restored successfully!");
      onSuccess?.();
      onClose();
    } catch (error) {
      notify.error("Failed to restore user");
      console.error(error);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Restore User"
      size="sm"
      primaryAction={{
        label: 'Restore',
        onClick: handleConfirmRestore,
        variant: 'primary',
        isLoading: isRestoring,
        loadingText: 'Restoring...'
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: onClose,
        variant: 'secondary',
      }}
    >
      <div className="space-y-3">
        <p className="text-sm text-text">
          Are you sure you want to restore {user?.name}? They will be moved back to active users.
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

export default RestoreUserModal;
