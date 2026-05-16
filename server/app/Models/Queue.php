<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Queue extends Model
{
    protected $fillable = [
        'queue_number',
        'service_id',
        'status',
        'priority',
        'notes',
        'served_at',
        'served_by',
    ];

    protected $casts = [
        'served_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function servedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'served_by');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }
}
