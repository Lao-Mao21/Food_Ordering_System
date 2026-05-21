<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AnalyticsSummaryGenerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_generate_an_analytics_summary_through_n8n(): void
    {
        config(['services.n8n.analytics_summary_webhook_url' => 'https://n8n.test/webhook/analytics-summary']);

        Http::fake([
            'https://n8n.test/webhook/analytics-summary' => Http::response([
                'summary' => 'Revenue reached ₱3,425 across 12 completed orders.',
                'insight' => 'Rice meals led the selected period.',
                'recommendation' => 'Feature the top rice meals in a short promo.',
            ]),
        ]);

        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $payload = [
            'range' => ['from' => '2026-05-01', 'to' => '2026-05-21'],
            'summary' => [
                'total_revenue' => 3425,
                'total_orders' => 12,
                'average_order_value' => 285.42,
                'cancelled_orders' => 1,
            ],
            'revenue_trend' => ['granularity' => 'daily', 'points' => []],
            'monthly_revenue' => [],
            'top_items' => [
                ['name' => 'Chicken Teriyaki Bowl', 'quantity_sold' => 8, 'revenue' => 1320],
            ],
            'yearly_top_items' => [],
        ];

        $response = $this->actingAs($admin)->postJson('/api/analytics/summary/generate', $payload);

        $response
            ->assertOk()
            ->assertJsonPath('data.summary', 'Revenue reached ₱3,425 across 12 completed orders.')
            ->assertJsonPath('data.insight', 'Rice meals led the selected period.')
            ->assertJsonPath('data.recommendation', 'Feature the top rice meals in a short promo.');

        Http::assertSent(fn ($request) => $request->url() === 'https://n8n.test/webhook/analytics-summary'
            && $request['summary']['total_revenue'] === 3425
            && $request['top_items'][0]['name'] === 'Chicken Teriyaki Bowl');
    }

    public function test_analytics_summary_generation_requires_a_configured_webhook(): void
    {
        config(['services.n8n.analytics_summary_webhook_url' => null]);

        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $this->actingAs($admin)->postJson('/api/analytics/summary/generate', [
            'range' => ['from' => '2026-05-01', 'to' => '2026-05-21'],
            'summary' => ['total_revenue' => 0],
        ])->assertStatus(400);
    }

    public function test_analytics_summary_generation_can_send_header_auth_to_n8n(): void
    {
        config([
            'services.n8n.analytics_summary_webhook_url' => 'https://n8n.test/webhook/analytics-summary',
            'services.n8n.analytics_summary_header_name' => 'x-n8n-summary-key',
            'services.n8n.analytics_summary_header_value' => 'secret-value',
        ]);

        Http::fake([
            'https://n8n.test/webhook/analytics-summary' => Http::response([
                'output' => [
                    'summary' => 'Sales are steady.',
                    'insight' => 'Top items are concentrated.',
                    'recommendation' => 'Rotate a promo item.',
                ],
            ]),
        ]);

        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $this->actingAs($admin)->postJson('/api/analytics/summary/generate', [
            'range' => ['from' => '2026-05-01', 'to' => '2026-05-21'],
            'summary' => ['total_revenue' => 100],
        ])->assertOk();

        Http::assertSent(fn ($request) => $request->hasHeader('x-n8n-summary-key', 'secret-value'));
    }

    public function test_analytics_summary_generation_accepts_ai_agent_output_shape(): void
    {
        config(['services.n8n.analytics_summary_webhook_url' => 'https://n8n.test/webhook/analytics-summary']);

        Http::fake([
            'https://n8n.test/webhook/analytics-summary' => Http::response([
                'output' => [
                    [
                        'Analytics_Summary' => 'Revenue is improving for the selected range.',
                        'Key_Insight' => 'Top sellers are concentrated in rice meals.',
                        'Next_Action' => 'Promote the leading bowl and test a drink bundle.',
                    ],
                ],
            ]),
        ]);

        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $this->actingAs($admin)->postJson('/api/analytics/summary/generate', [
            'range' => ['from' => '2026-05-01', 'to' => '2026-05-21'],
            'summary' => ['total_revenue' => 100],
        ])
            ->assertOk()
            ->assertJsonPath('data.summary', 'Revenue is improving for the selected range.')
            ->assertJsonPath('data.insight', 'Top sellers are concentrated in rice meals.')
            ->assertJsonPath('data.recommendation', 'Promote the leading bowl and test a drink bundle.');
    }
}
