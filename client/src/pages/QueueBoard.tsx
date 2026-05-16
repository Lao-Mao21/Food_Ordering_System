import { useEffect, useState } from "react";
import { MainLayout } from "../components/layouts";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/table/Table";
import { Button, LoadingSpinner } from "../components/ui";
import QueueService from "../services/QueueService";
import { notify } from "../util/notify";
import type { Queue } from "../interfaces/queue";

const QueueBoard = () => {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchQueues = async () => {
    setIsLoading(true);
    try {
      const response = await QueueService.getAll();
      setQueues(response.data || response);
    } catch (error) {
      console.error(error);
      notify.error("Unable to load queue board.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, []);

  const handleServe = async (id: number) => {
    setActionLoading(id);
    try {
      await QueueService.serve(id);
      notify.success("Queue item updated to serving.");
      await fetchQueues();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id: number) => {
    setActionLoading(id);
    try {
      await QueueService.complete(id);
      notify.success("Queue item marked complete.");
      await fetchQueues();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const statusClasses = (status: string) => {
    switch (status) {
      case "serving":
        return "bg-primary/10 text-primary";
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "skipped":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const content = (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border-muted bg-bg-light p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-text">Queue Board</h1>
            <p className="mt-2 text-sm text-text-muted">
              View active tickets, call the next customer, and mark queues complete.
            </p>
          </div>
          <Button variant="secondary" iconName="FaRepeat" onClick={fetchQueues} isLoading={isLoading}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-border-muted bg-bg-light p-6 shadow-sm">
        {isLoading ? (
          <div className="py-20">
            <LoadingSpinner size="lg" text="Loading queue data..." />
          </div>
        ) : queues.length === 0 ? (
          <div className="py-20 text-center text-text-muted">
            No queue tickets found. Use the dashboard to take a new queue number.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Number</TableCell>
                <TableCell isHeader>Service</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader>Created</TableCell>
                <TableCell isHeader align="center">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queues.map((queue) => (
                <TableRow key={queue.id}>
                  <TableCell>#{queue.queue_number}</TableCell>
                  <TableCell>{queue.service_name || `Service ${queue.service_id}`}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(queue.status)}`}>
                      {queue.status}
                    </span>
                  </TableCell>
                  <TableCell>{queue.created_at ? new Date(queue.created_at).toLocaleString() : "—"}</TableCell>
                  <TableCell align="center">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {queue.status === "pending" && (
                        <Button
                          variant="primary"
                          size="sm"
                          iconName="FaPlay"
                          isLoading={actionLoading === queue.id}
                          onClick={() => handleServe(queue.id)}
                        >
                          Serve
                        </Button>
                      )}
                      {queue.status === "serving" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          iconName="FaCheck"
                          isLoading={actionLoading === queue.id}
                          onClick={() => handleComplete(queue.id)}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );

  return <MainLayout content={content} />;
};

export default QueueBoard;
