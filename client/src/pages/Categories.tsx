import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "../components/layouts";
import { Button, LoadingSpinner, Modal } from "../components/ui";
import { InputField, Select } from "../components/ui/forms";
import { Table, TableBody, TableCell, TableHeader, TablePagination, TableRow } from "../components/ui/table/Table";
import type { Category, CategoryPayload } from "../interfaces/category";
import CategoryService from "../services/CategoryService";
import { unwrapData } from "../util/apiResponse";
import { notify } from "../util/notify";

const emptyForm: CategoryPayload = {
  name: "",
  is_active: true,
  sort_order: 0,
};

type CategorySortKey = "name" | "menu_items_count" | "is_active" | "sort_order";

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryPayload>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState<{ key: CategorySortKey; direction: "asc" | "desc" }>({ key: "sort_order", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await CategoryService.getAll({ include_inactive: true });
      const payload = unwrapData<{ categories: Category[] }>(response, { categories: [] });
      setCategories(payload.categories);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch = !query || category.name.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && category.is_active) ||
        (statusFilter === "inactive" && !category.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const sortedCategories = useMemo(() => {
    return [...filteredCategories].sort((a, b) => {
      const direction = sort.direction === "asc" ? 1 : -1;
      const first = a[sort.key];
      const second = b[sort.key];

      if (sort.key === "is_active") {
        return (Number(first) - Number(second)) * direction;
      }

      if (sort.key === "menu_items_count" || sort.key === "sort_order") {
        return (Number(first ?? 0) - Number(second ?? 0)) * direction;
      }

      return String(first ?? "").localeCompare(String(second ?? "")) * direction;
    });
  }, [filteredCategories, sort]);

  const totalPages = Math.max(Math.ceil(sortedCategories.length / pageSize), 1);
  const paginatedCategories = sortedCategories.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeCount = categories.filter((category) => category.is_active).length;
  const inactiveCount = categories.length - activeCount;
  const assignedCount = categories.filter((category) => (category.menu_items_count ?? 0) > 0).length;

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, search, sort, statusFilter]);

  const handleSort = (key: CategorySortKey) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const updateForm = (key: keyof CategoryPayload, value: string | number | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setForm(emptyForm);
    setIsFormOpen(false);
  };

  const startCreate = () => {
    setSelectedCategory(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const startEdit = (category: Category) => {
    setSelectedCategory(category);
    setForm({
      name: category.name,
      is_active: category.is_active,
      sort_order: category.sort_order ?? 0,
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      notify.error("Category name is required.");
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      sort_order: Number(form.sort_order) || 0,
    };

    setIsSaving(true);
    try {
      if (selectedCategory) {
        await CategoryService.update(selectedCategory.id, payload);
        notify.success(`Category updated: ${payload.name}.`);
      } else {
        await CategoryService.create(payload);
        notify.success(`Category added: ${payload.name}.`);
      }

      resetForm();
      await fetchCategories();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    setDeletingId(category.id);
    try {
      await CategoryService.delete(category.id);
      notify.success(`Category deleted: ${category.name}.`);
      await fetchCategories();
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
            <h1 className="text-xl font-black text-text">Categories</h1>
            <p className="mt-1 text-xs text-text-muted">{sortedCategories.length} of {categories.length} categories</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" iconName="FaRepeat" onClick={fetchCategories} isLoading={isLoading}>
              Refresh
            </Button>
            <Button variant="outline" iconName="FaPlus" onClick={startCreate}>
              New Category
            </Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <InputField
            label="Search"
            name="search"
            placeholder="Category name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            fullWidth
          />
          <Select
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            fullWidth
          />
          <Select
            label="Sort"
            value={`${sort.key}:${sort.direction}`}
            onChange={(event) => {
              const [key, direction] = event.target.value.split(":") as [CategorySortKey, "asc" | "desc"];
              setSort({ key, direction });
            }}
            options={[
              { value: "sort_order:asc", label: "Sort order low-high" },
              { value: "sort_order:desc", label: "Sort order high-low" },
              { value: "name:asc", label: "Name A-Z" },
              { value: "name:desc", label: "Name Z-A" },
              { value: "menu_items_count:desc", label: "Most menu items" },
              { value: "menu_items_count:asc", label: "Fewest menu items" },
            ]}
            fullWidth
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Categories", value: categories.length, tone: "text-primary" },
          { label: "Active", value: activeCount, tone: "text-success" },
          { label: "Inactive", value: inactiveCount, tone: "text-danger" },
          { label: "With Items", value: assignedCount, tone: "text-warning" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border-muted bg-bg-light p-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-xl font-black ${stat.tone}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border-muted bg-bg-light p-3 shadow-sm">
        <div className="mb-3">
          <h2 className="text-lg font-black text-text">Category List</h2>
          <p className="mt-1 text-xs text-text-muted">{sortedCategories.length} records match your filters</p>
        </div>
        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner size="lg" text="Loading categories..." />
          </div>
        ) : sortedCategories.length === 0 ? (
          <div className="py-12 text-center text-text-muted">No categories found.</div>
        ) : (
          <>
            <div className="max-h-[28rem] overflow-y-auto pr-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader sortKey="name" currentSort={sort} onSort={handleSort}>Name</TableCell>
                    <TableCell isHeader align="right" sortKey="menu_items_count" currentSort={sort} onSort={handleSort}>Items</TableCell>
                    <TableCell isHeader sortKey="is_active" currentSort={sort} onSort={handleSort}>Status</TableCell>
                    <TableCell isHeader align="right" sortKey="sort_order" currentSort={sort} onSort={handleSort}>Sort</TableCell>
                    <TableCell isHeader align="center">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-bold">{category.name}</TableCell>
                      <TableCell align="right">{category.menu_items_count ?? 0}</TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          category.is_active ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                        }`}>
                          {category.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell align="right">{category.sort_order ?? 0}</TableCell>
                      <TableCell align="center">
                        <div className="flex justify-center gap-2">
                          <Button size="sm" variant="outline" iconName="FaPen" onClick={() => startEdit(category)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            iconName="FaTrash"
                            onClick={() => handleDelete(category)}
                            isLoading={deletingId === category.id}
                            disabled={(category.menu_items_count ?? 0) > 0}
                            tooltip={(category.menu_items_count ?? 0) > 0 ? "Category has menu items" : undefined}
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
              totalResults={sortedCategories.length}
              pageSize={pageSize}
            />
          </>
        )}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={resetForm}
        title={selectedCategory ? "Edit Category" : "New Category"}
        size="lg"
        primaryAction={{
          label: selectedCategory ? "Save Category" : "Add Category",
          onClick: handleSave,
          isLoading: isSaving,
          iconName: selectedCategory ? "FaFloppyDisk" : "FaPlus",
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: resetForm,
          variant: "ghost",
        }}
      >
        <div className="space-y-4 not-italic">
          <InputField label="Name" name="name" value={form.name} onChange={(event) => updateForm("name", event.target.value)} fullWidth required />
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Sort Order" name="sortOrder" type="number" min={0} value={String(form.sort_order ?? 0)} onChange={(event) => updateForm("sort_order", Number(event.target.value))} fullWidth />
            <Select
              label="Status"
              value={form.is_active ? "true" : "false"}
              onChange={(event) => updateForm("is_active", event.target.value === "true")}
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
              fullWidth
            />
          </div>
        </div>
      </Modal>
    </div>
  );

  return <MainLayout content={content} />;
};

export default Categories;
