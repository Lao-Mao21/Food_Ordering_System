import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layouts';
import {
  Table,
  TableHeader,
  TableCell,
  TableBody,
  TableRow,
  TablePagination,
} from '../../components/ui/table/Table';
import { Button, LoadingSpinner, Icon } from '../../components/ui';
import { InputField } from '../../components/ui/forms';
import CreateUserModal from './components/CreateUserModal';
import EditUserModal from './components/EditUserModal';
import DeleteUserModal from './components/DeleteUserModal';
import UserService from '../../services/UserSerivce';
import type { User } from '../../interfaces/user';
import { notify } from '../../util/notify';
import { useDebounce, useDateFormatter } from '../../hooks/index';
import { PATHS } from '../../routes/path';
import { useAuth } from '../../contexts/AuthContext';

type SortState = {
  key: keyof User;
  direction: "asc" | "desc";
};

type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type UsersResponse = {
  data?: {
    users?: User[];
    data?: User[];
    meta?: PaginationMeta;
  };
  users?: User[];
  meta?: PaginationMeta;
};

const Users = () => {
  const navigate = useNavigate();
  const { user: currentUser, refreshUser, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const [sort, setSort] = useState<SortState>({
    key: "name",
    direction: "asc",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const isSearching = searchTerm?.trim() !== "";
  const debouncedSearchTerm = useDebounce(searchTerm);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchUsers = useCallback(async (currentPage = 1, pageLimit = 10) => {
    setIsLoading(true);
    try {
      const response = await UserService.getAll({
        page: currentPage,
        limit: pageLimit,
        search: debouncedSearchTerm,
        sort_by: sort.key,
        sort_order: sort.direction,
        filter: 'active',
      });

      const typedResponse = response as UsersResponse;
      const userData = typedResponse.data || typedResponse;
      const nextUsers = userData.users || (Array.isArray(userData.data) ? userData.data : []);
      setUsers(nextUsers);

      if (userData.meta) {
        setPagination({
          current_page: userData.meta.current_page || currentPage,
          last_page: userData.meta.last_page || 1,
          per_page: userData.meta.per_page || pageLimit,
          total: userData.meta.total || 0,
        });
      }
    } catch (error) {
      notify.error("Failed to load users");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, sort.direction, sort.key]);

  useEffect(() => {
    setPage(1);
    fetchUsers(1, pageSize);
  }, [fetchUsers, pageSize]);

  useEffect(() => {
    fetchUsers(page, pageSize);
  }, [fetchUsers, page, pageSize]);

  const handleSort = (key: keyof User) => {
    setPage(1);
    setSort((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const totalPages = pagination.last_page;

  const dateFormat = useDateFormatter();

  const [isCreateUserModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateUserClose = () => {
    setIsCreateModalOpen(false);
    setPage(1);
  };

  const [isEditUserModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleEditUserClose = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserSuccess = async () => {
    const editedCurrentUser = selectedUser?.id === currentUser?.id;

    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedUser(null);

    if (!editedCurrentUser) {
      await fetchUsers();
      return;
    }

    const refreshedUser = await refreshUser();

    if (!refreshedUser) {
      notify.error("Your session changed. Please log in again.");
      navigate(PATHS.LOGIN, { replace: true });
      return;
    }

    if (refreshedUser.role !== "admin") {
      notify.error("Your account no longer has admin access. Please log in with an admin account.");
      await logout();
      navigate(PATHS.LOGIN, { replace: true });
      return;
    }

    await fetchUsers();
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSuccess = async () => {
    await fetchUsers(page, pageSize);
    setUserToDelete(null);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const content = (
    <div className="space-y-6">
      <div className="rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-text">Users</h1>
            <p className="mt-1 text-sm text-text-muted">
              Manage active admin and staff accounts. Deleted users are handled in Recycle Bin.
            </p>
          </div>
          <Button variant='primary' iconName='FaPlus' onClick={() => setIsCreateModalOpen(true)}>
            Create User
          </Button>
        </div>

        <div className="mt-4">
          <InputField
            label='Search'
            name='search'
            placeholder='Search by name or email'
            fullWidth
            iconName='FaMagnifyingGlass'
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <tr>
            <TableCell isHeader>Avatar</TableCell>
            <TableCell
              isHeader
              sortKey="name"
              currentSort={sort}
              onSort={handleSort}
            >
              Name
            </TableCell>

            <TableCell
              isHeader
            >
              Email
            </TableCell>

            <TableCell isHeader>Phone</TableCell>

            <TableCell
              isHeader
              sortKey="role"
              currentSort={sort}
              onSort={handleSort}
            >
              Role
            </TableCell>
            <TableCell
              isHeader
              sortKey="created_at"
              currentSort={sort}
              onSort={handleSort}
            >
              Created At
            </TableCell>
            <TableCell
              isHeader
            >
              Action
            </TableCell>
          </tr>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12">
                <div className="flex items-center justify-center w-full">
                  <LoadingSpinner size="md" text={isSearching ? "Searching for users..." : "Loading Users...."} />
                </div>
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-12">
                <div className="flex flex-col items-center justify-center text-center space-y-4 w-full">
                  <div className="w-16 h-16 flex items-center justify-center rounded-full">
                    <Icon iconName="FaUsersSlash" className="text-3xl" />
                  </div>
                  <h2 className="text-lg font-semibold text-text">
                    No Users Found
                  </h2>

                  <p className="text-sm text-center text-text-muted">
                    We couldn't find any active users matching your search. Try another keyword or add a new user.
                  </p>

                  <Button variant='primary' iconName='FaPlus' onClick={() => setIsCreateModalOpen(true)}>
                    Create User
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  {user.avatar ? (
                    <img
                      src={`${import.meta.env.VITE_STORAGE_URL}/${user.avatar}`}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone || "-"}</TableCell>
                <TableCell className="capitalize">{user.role}</TableCell>
                <TableCell>{dateFormat.dateTime(user.created_at)}</TableCell>
                <TableCell>
                  <div className='flex gap-2 items-center justify-start'>
                    <Button
                      size='sm'
                      variant='ghost'
                      iconName='FaEye'
                      tooltip='View user details'
                      tooltipPosition='top'
                      className='text-primary hover:text-primary hover:bg-primary/10'
                      onClick={() => navigate(PATHS.APP.USER_DETAIL.replace(':slug', user.slug))}
                    />
                    <Button
                      size='sm'
                      variant='ghost'
                      iconName='FaPencil'
                      tooltip='Edit user'
                      tooltipPosition='top'
                      className='text-info hover:text-info hover:bg-info/10'
                      onClick={() => handleEditUser(user)}
                    />
                    <Button
                      size='sm'
                      variant='danger'
                      iconName='FaTrash'
                      tooltip='Delete user'
                      tooltipPosition='top'
                      onClick={() => handleDeleteUser(user)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!isLoading && users.length > 0 && (
        <TablePagination
          currentPage={pagination.current_page}
          totalPages={totalPages}
          totalResults={pagination.total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}

      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={handleCreateUserClose}
        onSuccess={handleUserSuccess}
      />
      
      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={handleEditUserClose}
        user={selectedUser}
        onSuccess={handleUserSuccess}
      />

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        user={userToDelete}
        onSuccess={handleDeleteSuccess}
      />

    </div>
  );

  return <MainLayout content={content} />;
};

export default Users;

