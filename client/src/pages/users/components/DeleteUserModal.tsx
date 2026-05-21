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
  currentUserId?: number | null;
};

const DeleteUserModal = ({ isOpen, onClose, user, onSuccess, currentUserId }: Props) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const isCurrentUser = !!user && user.id === currentUserId;

  const handleConfirmDelete = async () => {
    if (!user) return;

    if (isCurrentUser) {
      notify.error("You cannot delete the account you are currently using.");
      onClose();
      return;
    }

    setIsDeleting(true);
    try {
      await UserService.delete(user.id);
      notify.success("User moved to recycle bin successfully!");
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
      title='Delete User'
      size="sm"
      primaryAction={{
        label: 'Delete',
        onClick: handleConfirmDelete,
        variant: 'danger',
        isLoading: isDeleting,
        loadingText: 'Deleting...',
        disabled: isCurrentUser,
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: onClose,
        variant: 'secondary',
      }}
    >
      <div className="space-y-3">
        <p className="text-sm text-text">
          {isCurrentUser
            ? "You cannot delete the account you are currently using."
            : `Are you sure you want to delete ${user?.name}? They can be recovered from the recycle bin.`
          }
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
