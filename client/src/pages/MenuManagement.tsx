import { useEffect, useMemo, useRef, useState } from "react";
import { MainLayout } from "../components/layouts";
import { Button, LoadingSpinner, Modal } from "../components/ui";
import { InputField, Select, TextArea } from "../components/ui/forms";
import { Table, TableBody, TableCell, TableHeader, TablePagination, TableRow } from "../components/ui/table/Table";
import MenuItemService from "../services/MenuItemService";
import { notify } from "../util/notify";
import { unwrapData } from "../util/apiResponse";
import type { MenuItem, MenuItemPayload } from "../interfaces/menu";
import type { Category } from "../interfaces/category";

const emptyForm: MenuItemPayload = {
  name: "",
  category: "",
  category_id: null,
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

type MenuImageFieldProps = {
  value?: string | null;
  previewAlt: string;
  isUploading: boolean;
  onChange: (value: string) => void;
  onUpload: (file: File) => void;
};

const MenuImageField = ({ value, previewAlt, isUploading, onChange, onUpload }: MenuImageFieldProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const imageValue = value ?? "";

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify.error("Choose an image file.");
      return;
    }

    onUpload(file);
  };

  return (
    <div
      className={`grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem] ${isDragging ? "rounded-xl ring-2 ring-primary/30" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      <div className="flex flex-col gap-2">
        <label className="ml-1 text-sm font-semibold uppercase tracking-wider text-text-muted">
          Image
        </label>
        <div className="relative flex items-center">
          <input
            name="image"
            type="url"
            placeholder="https://example.com/menu-item.jpg"
            value={imageValue}
            onChange={(event) => onChange(event.target.value)}
            className="w-full h-24 rounded-xl border border-border-muted bg-bg-light py-3 pl-4 pr-32 text-sm text-text transition-all duration-200 ease-out placeholder:text-text-muted hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isUploading}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              handleFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              iconName="FaUpload"
              onClick={() => fileInputRef.current?.click()}
              isLoading={isUploading}
              tooltip="Upload image"
            >
              Upload
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border-muted bg-bg-light p-2">
        <div className="flex h-24 items-center justify-center overflow-hidden rounded-lg">
          <MenuImage src={imageValue} alt={previewAlt} className="h-24 w-full" />
        </div>
        {imageValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            iconName="FaXmark"
            className="mt-2 w-full"
            onClick={() => onChange("")}
            disabled={isUploading}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
};

const MenuManagement = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isCleaningName, setIsCleaningName] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  const fetchMenu = async () => {
    setIsLoading(true);
    try {
      const response = await MenuItemService.getAll({ include_unavailable: true });
      const payload = unwrapData<{ menu_items: MenuItem[]; categories?: Category[] }>(response, { menu_items: [], categories: [] });
      setItems(payload.menu_items);
      setCategories(payload.categories ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

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

  const updateForm = (key: keyof MenuItemPayload, value: string | number | boolean | null) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setSelectedItem(null);
    setForm(emptyForm);
    setIsFormOpen(false);
  };

  const startCreateItem = () => {
    setSelectedItem(null);
    setForm({ ...emptyForm, category_id: categories[0]?.id ?? null, category: categories[0]?.name ?? "" });
    setIsFormOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setSelectedItem(item);
    setForm({
      name: item.name,
      category: item.category,
      category_id: item.category_id ?? categories.find((category) => category.name === item.category)?.id ?? null,
      description: item.description ?? "",
      price: Number(item.price),
      is_available: item.is_available,
      image_url: item.image_url ?? "",
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.category_id) {
      notify.error("Name and category are required.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        category: categories.find((category) => category.id === form.category_id)?.name ?? form.category.trim(),
        description: form.description?.trim() || null,
        image_url: form.image_url?.trim() || null,
        price: Number(form.price),
      };

      if (selectedItem) {
        await MenuItemService.update(selectedItem.id, payload);
        notify.success(`Menu item updated: ${payload.name}.`);
      } else {
        await MenuItemService.create(payload);
        notify.success(`Menu item added: ${payload.name}.`);
      }

      resetForm();
      await fetchMenu();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateDescription = async () => {
    const name = form.name.trim();
    const category = categories.find((item) => item.id === form.category_id)?.name ?? form.category.trim();

    if (!name || !category) {
      notify.error("Add a name and category before generating a description.");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const response = await MenuItemService.generateDescription({
        name,
        category,
        price: Number(form.price) || null,
        image_url: form.image_url?.trim() || null,
      });
      const payload = unwrapData<{ description: string }>(response, { description: "" });

      if (!payload.description.trim()) {
        notify.error("The generator did not return a description.");
        return;
      }

      updateForm("description", payload.description.trim());
      notify.success("Description generated.");
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleCleanName = async () => {
    const name = form.name.trim();

    if (!name) {
      notify.error("Add a menu item name before fixing grammar.");
      return;
    }

    setIsCleaningName(true);
    try {
      const response = await MenuItemService.cleanName({ name });
      const payload = unwrapData<{ name: string }>(response, { name: "" });

      if (!payload.name.trim()) {
        notify.error("The grammar fixer did not return a name.");
        return;
      }

      updateForm("name", payload.name.trim());
      notify.success("Name fixed.");
    } catch (error) {
      console.error(error);
    } finally {
      setIsCleaningName(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const response = await MenuItemService.uploadImage(file);
      const payload = unwrapData<{ image_url: string }>(response, { image_url: "" });

      if (!payload.image_url) {
        notify.error("The image upload did not return a URL.");
        return;
      }

      updateForm("image_url", payload.image_url);
      notify.success("Image uploaded.");
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    const itemName = itemToDelete.name;
    setDeletingId(itemToDelete.id);
    try {
      await MenuItemService.delete(itemToDelete.id);
      notify.success(`Menu item deleted: ${itemName}.`);
      await fetchMenu();
      if (selectedItem?.id === itemToDelete.id) resetForm();
      setItemToDelete(null);
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
              ...categories.map((category) => ({ value: category.name, label: category.name })),
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
                            onClick={() => setItemToDelete(item)}
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
            <InputField
              label="Name"
              name="name"
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              className="pr-36"
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  iconName="FaWandMagicSparkles"
                  onClick={handleCleanName}
                  isLoading={isCleaningName}
                  disabled={isSaving || !form.name.trim()}
                  className="text-xs h-fit w-fit p-0"
                >
                  Grammar
                </Button>
              }
              fullWidth
              required
            />
            <Select
              label="Category"
              value={form.category_id ? String(form.category_id) : ""}
              onChange={(event) => {
                const category = categories.find((item) => item.id === Number(event.target.value));
                updateForm("category_id", category?.id ?? null);
                updateForm("category", category?.name ?? "");
              }}
              options={[
                { value: "", label: categories.length ? "Choose category" : "Create a category first" },
                ...categories.map((category) => ({ value: String(category.id), label: category.name })),
              ]}
              fullWidth
              required
            />
          </div>

          <div className="relative">
            <TextArea
              label="Description"
              name="description"
              value={form.description ?? ""}
              onChange={(event) => updateForm("description", event.target.value)}
              rows={3}
              className="pb-14 pr-4"
              fullWidth
            />
            <div className="absolute bottom-3 right-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                iconName="FaWandMagicSparkles"
                onClick={handleGenerateDescription}
                isLoading={isGeneratingDescription}
                disabled={isSaving || !form.name.trim() || !form.category_id}
              >
                Generate
              </Button>
            </div>
          </div>

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

          <MenuImageField
            value={form.image_url}
            previewAlt={form.name || "Menu item preview"}
            isUploading={isUploadingImage}
            onChange={(value) => updateForm("image_url", value)}
            onUpload={handleImageUpload}
          />
        </div>
      </Modal>

      <Modal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Delete Menu Item"
        size="sm"
        primaryAction={{
          label: "Delete",
          onClick: handleDelete,
          isLoading: deletingId === itemToDelete?.id,
          variant: "danger",
          iconName: "FaTrash",
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setItemToDelete(null),
          variant: "ghost",
        }}
      >
        <div className="not-italic text-sm leading-relaxed text-text-muted">
          Delete <span className="font-bold text-text">{itemToDelete?.name}</span>? It will move to the Recycle Bin and can be restored later.
        </div>
      </Modal>
    </div>
  );

  return <MainLayout content={content} />;
};

export default MenuManagement;









