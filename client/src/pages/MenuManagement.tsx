import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "../components/layouts";
import { Button, LoadingSpinner, Modal } from "../components/ui";
import { InputField, Select, TextArea } from "../components/ui/forms";
import { Table, TableBody, TableCell, TableHeader, TablePagination, TableRow } from "../components/ui/table/Table";
import MenuItemService from "../services/MenuItemService";
import { notify } from "../util/notify";
import { unwrapData } from "../util/apiResponse";
import type { MenuItem, MenuItemPayload } from "../interfaces/menu";

const emptyForm: MenuItemPayload = {
  name: "",
  category: "",
  description: "",
  price: 0,
  is_available: true,
  image_url: "",
};

type MenuSortKey = "name" | "category" | "price" | "is_available";

const formatCurrency = (value: string | number) =>
  Number(value || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });

type MenuImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
};

const MenuImage = ({ src, alt, className = "h-10 w-10" }: MenuImageProps) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={`${className} flex shrink-0 items-center justify-center rounded-lg border border-border-muted bg-primary/10 text-xs font-black text-primary`}>
        IMG
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} shrink-0 rounded-lg border border-border-muted object-cover`}
      onError={() => setHasError(true)}
    />
  );
};

const MenuManagement = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuItemPayload>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sort, setSort] = useState<{ key: MenuSortKey; direction: "asc" | "desc" }>({ key: "name", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchMenu = async () => {
    setIsLoading(true);
    try {
      const response = await MenuItemService.getAll({ include_unavailable: true });
      const payload = unwrapData<{ menu_items: MenuItem[] }>(response, { menu_items: [] });
      setItems(payload.menu_items);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).sort(),
    [items]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch = !query || [item.name, item.category, item.description ?? ""].some((value) =>
        value.toLowerCase().includes(query)
      );
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && item.is_available) ||
        (availabilityFilter === "unavailable" && !item.is_available);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [availabilityFilter, categoryFilter, items, search]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const first = a[sort.key];
      const second = b[sort.key];
      const direction = sort.direction === "asc" ? 1 : -1;

      if (typeof first === "boolean" || typeof second === "boolean") {
        return (Number(first) - Number(second)) * direction;
      }

      if (sort.key === "price") {
        return (Number(first) - Number(second)) * direction;
      }

      return String(first ?? "").localeCompare(String(second ?? "")) * direction;
    });
  }, [filteredItems, sort]);

  const totalPages = Math.max(Math.ceil(sortedItems.length / pageSize), 1);
  const paginatedItems = sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const availableCount = items.filter((item) => item.is_available).length;
  const unavailableCount = items.length - availableCount;

  useEffect(() => {
    setCurrentPage(1);
  }, [availabilityFilter, categoryFilter, pageSize, search, sort]);

  const handleSort = (key: MenuSortKey) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const updateForm = (key: keyof MenuItemPayload, value: string | number | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setSelectedItem(null);
    setForm(emptyForm);
    setIsFormOpen(false);
  };

  const startCreateItem = () => {
    setSelectedItem(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setSelectedItem(item);
    setForm({
      name: item.name,
      category: item.category,
      description: item.description ?? "",
      price: Number(item.price),
      is_available: item.is_available,
      image_url: item.image_url ?? "",
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.category.trim()) {
      notify.error("Name and category are required.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description?.trim() || null,
        image_url: form.image_url?.trim() || null,
        price: Number(form.price),
      };

      if (selectedItem) {
        await MenuItemService.update(selectedItem.id, payload);
        notify.success("Menu item updated.");
      } else {
        await MenuItemService.create(payload);
        notify.success("Menu item added.");
      }

      resetForm();
      await fetchMenu();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await MenuItemService.delete(id);
      notify.success("Menu item deleted.");
      await fetchMenu();
      if (selectedItem?.id === id) resetForm();
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  const content = (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border-muted bg-bg-light p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-black text-text">Menu Management</h1>
            <p className="mt-1 text-xs text-text-muted">{sortedItems.length} of {items.length} menu items</p>
          </div>
          <Button variant="secondary" iconName="FaRepeat" onClick={fetchMenu} isLoading={isLoading}>
            Refresh
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InputField
            label="Search"
            name="search"
            placeholder="Item, category, description"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            fullWidth
          />
          <Select
            label="Category"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            options={[
              { value: "all", label: "All categories" },
              ...categories.map((category) => ({ value: category, label: category })),
            ]}
            fullWidth
          />
          <Select
            label="Status"
            value={availabilityFilter}
            onChange={(event) => setAvailabilityFilter(event.target.value)}
            options={[
              { value: "all", label: "All statuses" },
              { value: "available", label: "Available" },
              { value: "unavailable", label: "Unavailable" },
            ]}
            fullWidth
          />
          <Select
            label="Sort"
            value={`${sort.key}:${sort.direction}`}
            onChange={(event) => {
              const [key, direction] = event.target.value.split(":") as [MenuSortKey, "asc" | "desc"];
              setSort({ key, direction });
            }}
            options={[
              { value: "name:asc", label: "Name A-Z" },
              { value: "name:desc", label: "Name Z-A" },
              { value: "price:asc", label: "Price low-high" },
              { value: "price:desc", label: "Price high-low" },
            ]}
            fullWidth
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Items", value: items.length, tone: "text-primary" },
          { label: "Available", value: availableCount, tone: "text-success" },
          { label: "Unavailable", value: unavailableCount, tone: "text-danger" },
          { label: "Categories", value: categories.length, tone: "text-warning" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border-muted bg-bg-light p-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-xl font-black ${stat.tone}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4">
        <div className="rounded-lg border border-border-muted bg-bg-light p-3 shadow-sm">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black text-text">Menu Items</h2>
              <p className="mt-1 text-xs text-text-muted">{sortedItems.length} records match your filters</p>
            </div>
            <Button variant="outline" size="sm" iconName="FaPlus" onClick={startCreateItem}>
              New Item
            </Button>
          </div>
          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" text="Loading menu..." />
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="py-12 text-center text-text-muted">No menu items found.</div>
          ) : (
            <>
              <div className="max-h-[28rem] overflow-y-auto pr-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader className="px-4 py-3" sortKey="name" currentSort={sort} onSort={handleSort}>Item</TableCell>
                    <TableCell isHeader className="px-4 py-3" sortKey="category" currentSort={sort} onSort={handleSort}>Category</TableCell>
                    <TableCell isHeader className="px-4 py-3" align="right" sortKey="price" currentSort={sort} onSort={handleSort}>Price</TableCell>
                    <TableCell isHeader className="px-4 py-3" sortKey="is_available" currentSort={sort} onSort={handleSort}>Status</TableCell>
                    <TableCell isHeader className="px-4 py-3" align="center">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <MenuImage src={item.image_url} alt={item.name} />
                          <div>
                            <p className="font-bold">{item.name}</p>
                            {item.description && (
                              <p className="mt-1 max-w-xs truncate text-xs text-text-muted">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">{item.category}</TableCell>
                      <TableCell className="px-4 py-3" align="right">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          item.is_available ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                        }`}>
                          {item.is_available ? "Available" : "Unavailable"}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3" align="center">
                        <div className="flex justify-center gap-2">
                          <Button size="sm" variant="outline" iconName="FaPen" onClick={() => handleEdit(item)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            iconName="FaTrash"
                            onClick={() => handleDelete(item.id)}
                            isLoading={deletingId === item.id}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(Math.min(Math.max(page, 1), totalPages))}
                onPageSizeChange={setPageSize}
                totalResults={sortedItems.length}
                pageSize={pageSize}
              />
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={resetForm}
        title={selectedItem ? "Edit Menu Item" : "New Menu Item"}
        size="lg"
        primaryAction={{
          label: selectedItem ? "Save Item" : "Add Item",
          onClick: handleSave,
          isLoading: isSaving,
          iconName: selectedItem ? "FaFloppyDisk" : "FaPlus",
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: resetForm,
          variant: "ghost",
        }}
      >
        <div className="space-y-4 not-italic">
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Name" name="name" value={form.name} onChange={(event) => updateForm("name", event.target.value)} fullWidth required />
            <InputField label="Category" name="category" value={form.category} onChange={(event) => updateForm("category", event.target.value)} placeholder="Rice meals, drinks, desserts" fullWidth required />
          </div>

          <TextArea label="Description" name="description" value={form.description ?? ""} onChange={(event) => updateForm("description", event.target.value)} rows={2} fullWidth />

          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Price" name="price" type="number" min={0} step="0.01" value={String(form.price)} onChange={(event) => updateForm("price", Number(event.target.value))} fullWidth required />
            <Select
              label="Availability"
              value={form.is_available ? "true" : "false"}
              onChange={(event) => updateForm("is_available", event.target.value === "true")}
              options={[
                { value: "true", label: "Available" },
                { value: "false", label: "Unavailable" },
              ]}
              fullWidth
            />
          </div>

          <div className={form.image_url ? "grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem]" : "grid gap-4"}>
            <InputField
              label="Image URL"
              name="imageUrl"
              type="url"
              placeholder="https://example.com/menu-item.jpg"
              value={form.image_url ?? ""}
              onChange={(event) => updateForm("image_url", event.target.value)}
              fullWidth
            />
            {form.image_url && (
              <div className="rounded-lg border border-border-muted bg-bg-light p-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Preview</p>
                <MenuImage src={form.image_url} alt={form.name || "Menu item preview"} className="h-24 w-full" />
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );

  return <MainLayout content={content} />;
};

export default MenuManagement;









