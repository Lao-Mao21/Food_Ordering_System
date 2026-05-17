<?php

namespace App\Http\Controllers;

use App\Models\Queue;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class QueueController extends Controller
{
    /**
     * GET /dashboard
     *
     * Returns the Inertia-rendered Dashboard for web session users.
     *
     * Data supplied:
     *  - services      : all active services with their pending-count loaded via a
     *                    withCount relationship alias (pending_count).
     *  - currentTicket : the oldest 'serving' queue row whose service belongs to
     *                    the logged-in clerk's counter_number, or null.
     */
    public function getDashboardData()
    {
        $user = Auth::user();

        $services = Service::query()
            ->where('is_active', true)
            ->withCount([
                'queues as pending_count' => function ($q) {
                    $q->where('status', 'pending');
                },
            ])
            ->orderBy('counter_number')
            ->get();

        $currentTicket = Queue::query()
            ->where('status', 'serving')
            ->whereHas('service', function ($q) use ($user) {
                $q->where('counter_number', $user->counter_number);
            })
            ->with(['service', 'servedBy'])
            ->oldest('served_at')
            ->first();

        return Inertia::render('Dashboard', [
            'services' => $services,
            'currentTicket' => $currentTicket,
        ]);
    }

    /**
     * POST /queue/issue-ticket
     *
     * Creates a new queue entry for the given service.
     *
     * Queue numbering rules:
     *  - Numbering is scoped per service AND per calendar day.
     *  - Finds the highest queue_number issued TODAY for the service and
     *    increments by 1 (starts at 1 when no tickets exist today).
     */
    public function issueTicket(Request $request)
    {
        $validated = $request->validate([
            'service_id' => ['required', 'integer', 'exists:services,id'],
        ]);

        $today = now()->startOfDay();

        $maxQueueNumber = Queue::query()
            ->where('service_id', $validated['service_id'])
            ->where('created_at', '>=', $today)
            ->max('queue_number');

        $nextNumber = $maxQueueNumber ? ((int) $maxQueueNumber + 1) : 1;

        $queue = Queue::create([
            'queue_number' => $nextNumber,
            'service_id' => $validated['service_id'],
            'status' => 'pending',
            'priority' => 0,
            'notes' => null,
        ]);

        $queue->load(['service']);

        return response()->json([
            'status' => 'Success',
            'message' => 'Ticket issued successfully.',
            'data' => $queue,
        ], 201);
    }

    /**
     * POST /queue/call-next
     *
     * Finds the oldest pending ticket across ALL services assigned to the
     * authenticated clerk's counter_number, marks it as serving, records who
     * served it and when, then returns the updated record.
     *
     * Each subsequent POST recalculates from scratch (oldest pending at
     * the counter) so there is no per-service state machine.
     */
    public function callNext(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'counter_number' => ['required', 'integer', 'min:1'],
        ]);

        $ticket = Queue::query()
            ->where('status', 'pending')
            ->whereHas('service', function ($q) use ($validated) {
                $q->where('counter_number', $validated['counter_number']);
            })
            ->with(['service', 'servedBy'])
            ->oldest('created_at')
            ->first();

        if (! $ticket) {
            return response()->json([
                'status' => 'Error',
                'message' => 'No pending tickets at this counter.',
                'data' => null,
            ], 404);
        }

        $ticket->update([
            'status' => 'serving',
            'served_by' => $user->id,
            'served_at' => now(),
        ]);

        $ticket->refresh();
        $ticket->load(['service', 'servedBy']);

        return response()->json([
            'status' => 'Success',
            'message' => 'Next ticket called successfully.',
            'data' => $ticket,
        ], 200);
    }

    /**
     * GET /queue/current-ticket
     *
     * Returns the one ticket currently in 'serving' status for the
     * authenticated clerk's own counter window.  Used by the
     * KioskReminder / CounterDisplay SPA components to auto-refresh
     * the active display without page reloads.
     *
     * Returns null when nothing is currently being served.
     */
    public function getCurrentTicket(Request $request)
    {
        $user = $request->user();

        $currentTicket = Queue::query()
            ->where('status', 'serving')
            ->whereHas('service', function ($q) use ($user) {
                $q->where('counter_number', $user->counter_number);
            })
            ->with(['service', 'servedBy'])
            ->oldest('served_at')
            ->first();

        return response()->json([
            'status' => 'Success',
            'message' => $currentTicket ? 'Current serving ticket retrieved.' : 'No ticket is currently being served.',
            'data' => $currentTicket,
        ], 200);
    }

    /**
     * POST /queue/update-status/{id}
     *
     * Finalises a queue entry by marking it 'completed' or 'skipped'.
     */
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['completed', 'skipped'])],
        ]);

        $ticket = Queue::findOrFail($id);

        $ticket->update([
            'status' => $validated['status'],
        ]);

        $ticket->refresh();
        $ticket->load(['service', 'servedBy']);

        return response()->json([
            'status' => 'Success',
            'message' => "Ticket status updated to '{$validated['status']}'.",
            'data' => $ticket,
        ], 200);
    }
}
