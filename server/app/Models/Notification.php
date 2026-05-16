<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $fillable = [
        'queue_id',
        'notification_type',
        'recipient',
        'message',
        'status',
        'error_message',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function queue(): BelongsTo
    {
        return $this->belongsTo(Queue::class);
    }
}
