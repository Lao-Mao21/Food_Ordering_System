<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'n8n' => [
        'menu_description_webhook_url' => env('N8N_MENU_DESCRIPTION_WEBHOOK_URL'),
        'menu_description_header_name' => env('N8N_MENU_DESCRIPTION_HEADER_NAME'),
        'menu_description_header_value' => env('N8N_MENU_DESCRIPTION_HEADER_VALUE'),
        'menu_name_cleaner_webhook_url' => env('N8N_MENU_NAME_CLEANER_WEBHOOK_URL'),
        'menu_name_cleaner_header_name' => env('N8N_MENU_NAME_CLEANER_HEADER_NAME'),
        'menu_name_cleaner_header_value' => env('N8N_MENU_NAME_CLEANER_HEADER_VALUE'),
        'analytics_summary_webhook_url' => env('N8N_ANALYTICS_SUMMARY_WEBHOOK_URL'),
        'analytics_summary_header_name' => env('N8N_ANALYTICS_SUMMARY_HEADER_NAME'),
        'analytics_summary_header_value' => env('N8N_ANALYTICS_SUMMARY_HEADER_VALUE'),
        'order_note_cleaner_webhook_url' => env('N8N_ORDER_NOTE_CLEANER_WEBHOOK_URL'),
        'order_note_cleaner_header_name' => env('N8N_ORDER_NOTE_CLEANER_HEADER_NAME'),
        'order_note_cleaner_header_value' => env('N8N_ORDER_NOTE_CLEANER_HEADER_VALUE'),
        'timeout' => env('N8N_TIMEOUT', 30),
    ],

];
