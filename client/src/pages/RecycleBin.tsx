import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "../components/layouts";
import { Button, LoadingSpinner } from "../components/ui";
import { InputField } from "../components/ui/forms";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/table/Table";
import type { Category } from "../interfaces/category";
import type { MenuItem } from "../interfaces/menu";
import type { User } from "../interfaces/user";
import CategoryService from "../services/CategoryService";
import MenuItemService from "../services/MenuItemService";
import RecycleBinService from "../services/RecycleBinService";
import UserService from "../services/UserSerivce";
import { unwrapData } from "../util/apiResponse";
import { notify } from "../util/notify";

type RecycleBinPayload = {
  users: User[];
  categories: Category[];
  menu_items: MenuItem[];
};

type RecycleTab = "menu_items" | "categories" | "users";

const emptyPayload: RecycleBinPayload = {
  users: [],
  categories: [],
  menu_items: [],
};

const formatDeletedAt = (value?: string | null) =>
  value ? new Date(value).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) : "Unknown";

const formatCurrency = (value: string | number) =>
  Number(value || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });

const RecycleBin = () => {
  const [items, setItems] = useState<RecycleBinPayload>(emptyPayload);
  const [activeTab, setActiveTab] = useState<RecycleTab>("menu_items");
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchRecycleBin = async () => {
    setIsLoading(true);
    try {
      const response = await RecycleBinService.getAll();
      const payload = unwrapData<RecycleBinPayload>(response, emptyPayload);
      setItems(payload);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecycleBin();
  }, []);

  const counts = useMemo(
    () => ({
      menu_items: items.menu_items.length,
      categories: items.categories.length,
      users: items.users.length,
      total: items.menu_items.length + items.categories.length + items.users.length,
    }),
    [items]
  );

  const query = search.trim().toLowerCase();
  const filteredMenuItems = useMemo(
    () =>
      items.menu_items.filter((item) =>
        !query || [item.name, item.category].some((value) => String(value ?? "").toLowerCase().includes(query))
      ),
    [items.menu_items, query]
  );
  const filteredCategories = useMemo(
    () =>
      items.categories.filter((category) =>
        !query || category.name.toLowerCase().includes(query)
      ),
    [items.categories, query]
  );
  const filteredUsers = useMemo(
    () =>
      items.users.filter((user) =>
        !query || [user.name, user.email, user.role].some((value) => String(value ?? "").toLowerCase().includes(query))
      ),
    [items.users, query]
  );

  const handleRestore = async (type: RecycleTab, id: number, label: string) => {
    setBusyKey(`${type}:restore:${id}`);
    try {
      if (type === "menu_items") await MenuItemService.restore(id);
      if (type === "categories") await CategoryService.restore(id);
      if (type === "users") await UserService.restore(id);

      notify.success(`Restored: ${label}.`);
      await fetchRecycleBin();
    } catch (error) {
      console.error(error);
    } finally {
      setBusyKey(null);
    }
  };

  const handlePermanentDelete = async (type: RecycleTab, id: number, label: string) => {
    setBusyKey(`${type}:delete:${id}`);
    try {
      if (type === "menu_items") await MenuItemService.forceDelete(id);
      if (type === "categories") await CategoryService.forceDelete(id);
      if (type === "users") await UserService.forceDelete(id);

      notify.success(`Permanently deleted: ${label}.`);
      await fetchRecycleBin();
    } catch (error) {
      console.error(error);
    } finally {
      setBusyKey(null);
    }
  };

  const tabs: { key: RecycleTab; label: string; count: number }[] = [
    { key: "menu_items", label: "Menu Items", count: counts.menu_items },
    { key: "categories", label: "Categories", count: counts.categories },
    { key: "users", label: "Users", count: counts.users },
  ];

  const content = (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border-muted bg-bg-light p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-black text-text">Recycle Bin</h1>
            <p className="mt-1 text-xs text-text-muted">{counts.total} deleted records</p>
          </div>
          <Button variant="secondary" iconName="FaRepeat" onClick={fetchRecycleBin} isLoading={isLoading}>
            Refresh
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label} ({tab.count})
            </Button>
          ))}
        </div>
        <InputField
          label="Search"
          name="recycleSearch"
          placeholder="Search deleted records"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          iconName="FaMagnifyingGlass"
          fullWidth
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Deleted", value: counts.total, tone: "text-primary" },
          { label: "Menu Items", value: counts.menu_items, tone: "text-warning" },
          { label: "Categories", value: counts.categories, tone: "text-success" },
          { label: "Users", value: counts.users, tone: "text-danger" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border-muted bg-bg-light p-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-xl font-black ${stat.tone}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border-muted bg-bg-light p-3 shadow-sm">
        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner size="lg" text="Loading recycle bin..." />
          </div>
        ) : (
          <>
            {activeTab === "menu_items" && (
              filteredMenuItems.length === 0 ? (
                <div className="py-12 text-center text-text-muted">No deleted menu items.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader>Item</TableCell>
                      <TableCell isHeader>Category</TableCell>
                      <TableCell isHeader align="right">Price</TableCell>
                      <TableCell isHeader>Deleted</TableCell>
                      <TableCell isHeader align="center">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMenuItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-bold">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                        <TableCell>{formatDeletedAt(item.deleted_at)}</TableCell>
                        <TableCell align="center">
                          <div className="flex justify-center gap-2">
                            <Button size="sm" variant="outline" iconName="FaRotateLeft" onClick={() => handleRestore("menu_items", item.id, item.name)} isLoading={busyKey === `menu_items:restore:${item.id}`}>
                              Restore
                            </Button>
                            <Button size="sm" variant="danger" iconName="FaTrash" onClick={() => handlePermanentDelete("menu_items", item.id, item.name)} isLoading={busyKey === `menu_items:delete:${item.id}`}>
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            )}

            {activeTab === "categories" && (
              filteredCategories.length === 0 ? (
                <div className="py-12 text-center text-text-muted">No deleted categories.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader>Category</TableCell>
                      <TableCell isHeader align="right">Linked Items</TableCell>
                      <TableCell isHeader>Deleted</TableCell>
                      <TableCell isHeader align="center">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-bold">{category.name}</TableCell>
                        <TableCell align="right">{category.menu_items_count ?? 0}</TableCell>
                        <TableCell>{formatDeletedAt(category.deleted_at)}</TableCell>
                        <TableCell align="center">
                          <div className="flex justify-center gap-2">
                            <Button size="sm" variant="outline" iconName="FaRotateLeft" onClick={() => handleRestore("categories", category.id, category.name)} isLoading={busyKey === `categories:restore:${category.id}`}>
                              Restore
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              iconName="FaTrash"
                              onClick={() => handlePermanentDelete("categories", category.id, category.name)}
                              isLoading={busyKey === `categories:delete:${category.id}`}
                              disabled={(category.menu_items_count ?? 0) > 0}
                              tooltip={(category.menu_items_count ?? 0) > 0 ? "Category has linked menu items" : undefined}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            )}

            {activeTab === "users" && (
              filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-text-muted">No deleted users.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader>Name</TableCell>
                      <TableCell isHeader>Email</TableCell>
                      <TableCell isHeader>Role</TableCell>
                      <TableCell isHeader>Deleted</TableCell>
                      <TableCell isHeader align="center">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-bold">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{formatDeletedAt(user.deleted_at)}</TableCell>
                        <TableCell align="center">
                          <div className="flex justify-center gap-2">
                            <Button size="sm" variant="outline" iconName="FaRotateLeft" onClick={() => handleRestore("users", user.id, user.name)} isLoading={busyKey === `users:restore:${user.id}`}>
                              Restore
                            </Button>
                            <Button size="sm" variant="danger" iconName="FaTrash" onClick={() => handlePermanentDelete("users", user.id, user.name)} isLoading={busyKey === `users:delete:${user.id}`}>
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            )}
          </>
        )}
      </div>
    </div>
  );

  return <MainLayout content={content} />;
};

export default RecycleBin;
