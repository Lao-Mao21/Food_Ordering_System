import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "../components/layouts";
import { Button, LoadingSpinner } from "../components/ui";
import { InputField, Select, TextArea } from "../components/ui/forms";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/table/Table";
import MenuItemService from "../services/MenuItemService";
import { notify } from "../util/notify";
import { unwrapData } from "../util/apiResponse";
import type { MenuItem, MenuItemPayload } from "../interfaces/menu";

const emptyForm: MenuItemPayload = {
  name: "",
  category: "",
  description: "",
  price: 0,
  stock_quantity: 0,
  is_available: true,
  image_url: "",
};

const formatCurrency = (value: string | number) =>
  Number(value || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });

const MenuManagement = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuItemPayload>(emptyForm);
  const [search, setSearch] = useState("");
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

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) =>
      [item.name, item.category, item.description ?? ""].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [items, search]);

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).sort(),
    [items]
  );

  const updateForm = (key: keyof MenuItemPayload, value: string | number | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setSelectedItem(null);
    setForm(emptyForm);
  };

  const handleEdit = (item: MenuItem) => {
    setSelectedItem(item);
    setForm({
      name: item.name,
      category: item.category,
      description: item.description ?? "",
      price: Number(item.price),
      stock_quantity: item.stock_quantity,
      is_available: item.is_available,
      image_url: item.image_url ?? "",
    });
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
        stock_quantity: Number(form.stock_quantity),
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-text">Menu Management</h1>
          <p className="mt-1 text-sm text-text-muted">{items.length} menu items across {categories.length} categories</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <InputField
            label="Search"
            name="search"
            placeholder="Item, category, description"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button variant="secondary" iconName="FaRepeat" onClick={fetchMenu} isLoading={isLoading}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm">
          {isLoading ? (
            <div className="py-20">
              <LoadingSpinner size="lg" text="Loading menu..." />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-20 text-center text-text-muted">No menu items found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Item</TableCell>
                  <TableCell isHeader>Category</TableCell>
                  <TableCell isHeader align="right">Price</TableCell>
                  <TableCell isHeader align="center">Stock</TableCell>
                  <TableCell isHeader>Status</TableCell>
                  <TableCell isHeader align="center">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-bold">{item.name}</p>
                        {item.description && (
                          <p className="mt-1 max-w-xs truncate text-xs text-text-muted">{item.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                    <TableCell align="center">{item.stock_quantity}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        item.is_available ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                      }`}>
                        {item.is_available ? "Available" : "Hidden"}
                      </span>
                    </TableCell>
                    <TableCell align="center">
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
          )}
        </div>

        <div className="rounded-lg border border-border-muted bg-bg-light p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-text">{selectedItem ? "Edit Item" : "Add Item"}</h2>
              <p className="mt-1 text-sm text-text-muted">Inventory-backed menu record</p>
            </div>
            {selectedItem && (
              <Button variant="ghost" size="sm" iconName="FaPlus" onClick={resetForm}>
                New
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <InputField label="Name" name="name" value={form.name} onChange={(event) => updateForm("name", event.target.value)} fullWidth required />
            <InputField label="Category" name="category" value={form.category} onChange={(event) => updateForm("category", event.target.value)} placeholder="Rice meals, drinks, desserts" fullWidth required />
            <TextArea label="Description" name="description" value={form.description ?? ""} onChange={(event) => updateForm("description", event.target.value)} fullWidth />
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Price" name="price" type="number" min={0} step="0.01" value={String(form.price)} onChange={(event) => updateForm("price", Number(event.target.value))} fullWidth required />
              <InputField label="Stock" name="stock" type="number" min={0} value={String(form.stock_quantity)} onChange={(event) => updateForm("stock_quantity", Number(event.target.value))} fullWidth required />
            </div>
            <Select
              label="Availability"
              value={form.is_available ? "true" : "false"}
              onChange={(event) => updateForm("is_available", event.target.value === "true")}
              options={[
                { value: "true", label: "Available" },
                { value: "false", label: "Hidden" },
              ]}
              fullWidth
            />
            <InputField label="Image URL" name="imageUrl" value={form.image_url ?? ""} onChange={(event) => updateForm("image_url", event.target.value)} fullWidth />
            <Button iconName={selectedItem ? "FaFloppyDisk" : "FaPlus"} onClick={handleSave} isLoading={isSaving} fullWidth>
              {selectedItem ? "Save Item" : "Add Item"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return <MainLayout content={content} />;
};

export default MenuManagement;
