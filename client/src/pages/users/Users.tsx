import { useState, useEffect } from 'react';
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
import { Button, ToastProvider, LoadingSpinner, Icon } from '../../components/ui';
import { InputField } from '../../components/ui/forms';
import CreateUserModal from './components/CreateUserModal';
import EditUserModal from './components/EditUserModal';
import DeleteUserModal from './components/DeleteUserModal';
import RestoreUserModal from './components/RestoreUserModal';
import UserService from '../../services/UserSerivce';
import type { User } from '../../interfaces/user';
import { notify } from '../../util/notify';
import { useDebounce, useDateFormatter } from '../../hooks/index';
import { PATHS } from '../../routes/path';

/* =========================
   TYPES
========================= */
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

const Users = () => {
  const navigate = useNavigate();
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

  const [filter, setFilter] = useState<'active' | 'deleted' | 'all'>('active');
  const filters = {
    active: {
      icon: 'FaCheck',
      label: 'Active Users',
    },
    deleted: {
      icon: 'FaTrash',
      label: 'Deleted Users',
    },
    all: {
      icon: 'FaList',
      label: 'All Users',
    },
  } as const;

  const [searchTerm, setSearchTerm] = useState("");
  const isSearching = searchTerm?.trim() !== "";
  const debouncedSearchTerm = useDebounce(searchTerm);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* =========================
     FETCH USERS
  ========================= */
  const fetchUsers = async (currentPage = 1, pageLimit = 10) => {
    setIsLoading(true);
    try {
      const response = await UserService.getAll({
        page: currentPage,
        limit: pageLimit,
        search: debouncedSearchTerm,
        sort_by: sort.key,
        sort_order: sort.direction,
        filter: filter,
      });

      // Extract users and pagination metadata
      const userData = response.data || response;
      setUsers(userData.users || userData.data || []);

      // Update pagination metadata
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
  };

  useEffect(() => {
    setPage(1); // Reset to first page when filter changes
    fetchUsers(1, pageSize);
  }, [filter]);

  useEffect(() => {
    fetchUsers(page, pageSize);
  }, [page, pageSize, sort, debouncedSearchTerm, filter]);

  /* =========================
     SORT HANDLER
  ========================= */
  const handleSort = (key: keyof User) => {
    setPage(1); // Reset to first page when sorting
    setSort((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  /* =========================
     PAGINATION
  ========================= */
  const totalPages = pagination.last_page;

  /* =========================
    Date Formmater 
  ========================= */

  const dateFormat = useDateFormatter();

  /* =========================
     MODAL STATE
  ========================= */
  const [isCreateUserModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateUserClose = () => {
    setIsCreateModalOpen(false);
    setPage(1);
  };

  const [isEditUserModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [userToRestore, setUserToRestore] = useState<User | null>(null);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleEditUserClose = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserSuccess = async () => {
    await fetchUsers();

    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);

    setSelectedUser(null);
  };

  /* =========================
     DELETE HANDLER
  ========================= */
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

  /* =========================
     RESTORE HANDLER
  ========================= */
  const handleRestoreUser = (user: User) => {
    setUserToRestore(user);
    setIsRestoreModalOpen(true);
  };

  const handleRestoreSuccess = async () => {
    await fetchUsers(page, pageSize);
    setUserToRestore(null);
  };

  const handleCancelRestore = () => {
    setIsRestoreModalOpen(false);
    setUserToRestore(null);
  };

  const content = (
    <div className="space-y-6">
      {/* Search and Controls Bar */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <InputField
            label='Search'
            name='search'
            placeholder='Searching user by name, email.'
            fullWidth
            iconName='FaMagnifyingGlass'
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Button variant='primary' iconName='FaPlus' onClick={() => setIsCreateModalOpen(true)}>
          Create User
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="gap-2 bg-bg-light rounded-xl p-1 flex flex-wrap w-fit">
        {(Object.keys(filters) as Array<keyof typeof filters>).map((f) => {
          const { icon, label } = filters[f];
          return (
            <Button
              key={f}
              variant='primary'
              onClick={() => setFilter(f)}
              iconName={icon}
              className={`relative px-4 py-2.5 rounded-lg font-semibold uppercase text-xs transition-all duration-300 flex items-center gap-2 group ${filter === f
                ? 'bg-primary text-bg-dark shadow-lg shadow-primary/30'
                : 'bg-transparent text-text hover:bg-bg-light/50'
                }`}
            >
              <span>{label}</span>

              {filter === f && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-primary/0 via-primary to-primary/0 rounded-full tab-indicator" />
              )}
            </Button>
          );
        })}
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

                  {/* Icon */}
                  <div className="w-16 h-16 flex items-center justify-center rounded-full">
                    <Icon iconName="FaUsersSlash" className="text-3xl" />
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-semibold text-text">
                    No Users Found
                  </h2>

                  <p className="text-sm text-center text-text-muted">
                    We couldn’t find any users matching your criteria. Try adjusting your filters or add a new user.
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
                    {filter === 'deleted' && (
                      <Button
                        size='sm'
                        variant='primary'
                        iconName='FaArrowRotateLeft'
                        tooltip='Restore user'
                        tooltipPosition='top'
                        onClick={() => handleRestoreUser(user)}
                      />
                    )}
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
        isPermanentDelete={filter === 'deleted'}
        onSuccess={handleDeleteSuccess}
      />

      <RestoreUserModal
        isOpen={isRestoreModalOpen}
        onClose={handleCancelRestore}
        user={userToRestore}
        onSuccess={handleRestoreSuccess}
      />

      <ToastProvider />
    </div>
  );

  return <MainLayout content={content} />;
};

export default Users;