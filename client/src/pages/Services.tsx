import { useEffect, useState } from "react";
import { MainLayout } from "../components/layouts";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/table/Table";
import { Button, LoadingSpinner } from "../components/ui";
import { InputField } from "../components/ui/forms";
import ServiceService from "../services/ServiceService";
import { notify } from "../util/notify";
import type { Service } from "../interfaces/service";

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [counterNumber, setCounterNumber] = useState(1);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const response = await ServiceService.getAll();
      setServices(response.data || response);
    } catch (error) {
      console.error(error);
      notify.error("Unable to load services.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAddService = async () => {
    if (!serviceName.trim()) {
      notify.error("Service name is required.");
      return;
    }

    setIsSaving(true);
    try {
      await ServiceService.create({
        name: serviceName.trim(),
        counter_number: counterNumber,
        description: "",
        is_active: true,
      });
      notify.success("Service created successfully.");
      setServiceName("");
      setCounterNumber(1);
      await fetchServices();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const content = (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border-muted bg-bg-light p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-text">Service Management</h1>
            <p className="mt-2 text-sm text-text-muted">
              Create and manage queue services, counters, and availability.
            </p>
          </div>
          <Button variant="secondary" iconName="FaRepeat" onClick={fetchServices} isLoading={isLoading}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-border-muted bg-bg-light p-6 shadow-sm">
          {isLoading ? (
            <div className="py-20">
              <LoadingSpinner size="lg" text="Loading services..." />
            </div>
          ) : services.length === 0 ? (
            <div className="py-20 text-center text-text-muted">
              No services found. Add a service to begin accepting queue tickets.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Service</TableCell>
                  <TableCell isHeader>Counter</TableCell>
                  <TableCell isHeader>Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>{service.name}</TableCell>
                    <TableCell>Counter {service.counter_number}</TableCell>
                    <TableCell>{service.is_active ? "Active" : "Inactive"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-3xl border border-border-muted bg-bg-light p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-black text-text">Create New Service</h2>
            <p className="mt-2 text-sm text-text-muted">
              Add a new counter or service category for your queue system.
            </p>
          </div>
          <div className="space-y-4">
            <InputField
              label="Service Name"
              name="serviceName"
              placeholder="e.g. Development Support"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              required
            />

            <InputField
              label="Counter Number"
              name="counterNumber"
              type="number"
              min={1}
              value={counterNumber.toString()}
              onChange={(e) => setCounterNumber(Number(e.target.value))}
              required
            />

            <Button
              variant="primary"
              iconName="FaPlus"
              onClick={handleAddService}
              isLoading={isSaving}
            >
              Add Service
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return <MainLayout content={content} />;
};

export default Services;
