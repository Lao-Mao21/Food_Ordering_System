import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "../components/layouts";
import { Button, Icon, LoadingSpinner } from "../components/ui";
import { Select } from "../components/ui/forms";
import QueueService from "../services/QueueService";
import ServiceService from "../services/ServiceService";
import { notify } from "../util/notify";
import type { Queue } from "../interfaces/queue";
import type { Service } from "../interfaces/service";

const Dashboard = () => {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [queueResponse, serviceResponse] = await Promise.all([
        QueueService.getAll({}),
        ServiceService.getAll(),
      ]);

      setQueues(queueResponse.data || queueResponse);
      setServices(serviceResponse.data || serviceResponse);
      setSelectedServiceId((serviceResponse.data || serviceResponse)[0]?.id?.toString() || "");
    } catch (error) {
      console.error(error);
      notify.error("Unable to load queue dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const summary = useMemo(() => ({
    pending: queues.filter((queue) => queue.status === "pending").length,
    serving: queues.filter((queue) => queue.status === "serving").length,
    completed: queues.filter((queue) => queue.status === "completed").length,
    skipped: queues.filter((queue) => queue.status === "skipped").length,
  }), [queues]);

  const nextQueueNumber = useMemo(() => {
    if (!queues.length) return 1;
    return Math.max(...queues.map((queue) => queue.queue_number)) + 1;
  }, [queues]);

  const currentServing = useMemo(
    () => queues.find((queue) => queue.status === "serving"),
    [queues]
  );

  const handleTakeNumber = async () => {
    if (!selectedServiceId) {
      notify.error("Please select a service before taking a queue number.");
      return;
    }

    setIsActionLoading(true);
    try {
      await QueueService.create({
        queue_number: nextQueueNumber,
        service_id: Number(selectedServiceId),
        status: "pending",
      });
      notify.success(`Your queue number is ${nextQueueNumber}.`);
      await fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCallNext = async () => {
    const nextPending = queues
      .filter((queue) => queue.status === "pending")
      .sort((a, b) => a.queue_number - b.queue_number)[0];

    if (!nextPending) {
      notify.info("No pending queue items.");
      return;
    }

    setIsActionLoading(true);
    try {
      await QueueService.serve(nextPending.id);
      notify.success(`Now serving ${nextPending.queue_number}.`);
      await fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const content = (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-border-muted bg-bg-light p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-black text-text">Queue System Dashboard</h1>
                <p className="mt-2 text-sm text-text-muted">
                  Manage the queue flow, display current serving number, and take a new ticket.
                </p>
              </div>
              <Button variant="secondary" iconName="FaRepeat" onClick={fetchData} isLoading={isLoading}>
                Refresh Data
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {([
                { label: "Pending", value: summary.pending, icon: "FaClock" as const },
                { label: "Serving", value: summary.serving, icon: "FaHeadphones" as const },
                { label: "Completed", value: summary.completed, icon: "FaCheck" as const },
                { label: "Skipped", value: summary.skipped, icon: "FaForward" as const },
              ] as const).map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-border-muted bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon iconName={stat.icon} size={20} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-text-muted">{stat.label}</p>
                      <p className="mt-2 text-3xl font-black text-text">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border-muted bg-bg-light p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-text">Current Serving</h2>
                <p className="mt-2 text-sm text-text-muted">Live queue status for the active ticket.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" iconName="FaTicket" onClick={handleTakeNumber} isLoading={isActionLoading}>
                  Take Queue Number
                </Button>
                <Button variant="secondary" iconName="FaBullhorn" onClick={handleCallNext} isLoading={isActionLoading}>
                  Call Next
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-border-muted bg-white p-5">
                <p className="text-sm uppercase tracking-[0.25em] text-text-muted">Your Next Number</p>
                <p className="mt-4 text-5xl font-black text-primary">#{nextQueueNumber}</p>
              </div>

              <div className="rounded-3xl border border-border-muted bg-white p-5 sm:col-span-2">
                <p className="text-sm uppercase tracking-[0.25em] text-text-muted">Selected Service</p>
                <div className="mt-4 max-w-xs">
                  <Select
                    label="Service"
                    name="service"
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    options={services.map((service) => ({
                      label: `${service.name} (Counter ${service.counter_number})`,
                      value: service.id.toString(),
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border-muted bg-bg-light p-6 shadow-sm">
          <h2 className="text-xl font-black text-text mb-4">Live Queue Display</h2>
          <div className="rounded-3xl border border-border-muted bg-white p-6 text-center">
            {isLoading ? (
              <LoadingSpinner size="lg" text="Loading queue..." />
            ) : currentServing ? (
              <>
                <p className="text-sm uppercase tracking-[0.25em] text-text-muted">Now Serving</p>
                <p className="mt-4 text-6xl font-black text-primary">#{currentServing.queue_number}</p>
                <p className="mt-3 text-sm text-text-muted">
                  {currentServing.service_name || "Unknown service"}
                </p>
              </>
            ) : (
              <p className="text-sm text-text-muted">No ticket is being served right now.</p>
            )}
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-border-muted bg-white p-5">
              <p className="font-semibold text-text">Next in line</p>
              <p className="mt-2 text-4xl font-black text-text">#{queues.filter((queue) => queue.status === "pending").sort((a, b) => a.queue_number - b.queue_number)[0]?.queue_number || "—"}</p>
            </div>
            <div className="rounded-3xl border border-border-muted bg-white p-5">
              <p className="font-semibold text-text">Waiting customers</p>
              <p className="mt-2 text-4xl font-black text-text">{summary.pending}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return <MainLayout content={content} />;
};

export default Dashboard;