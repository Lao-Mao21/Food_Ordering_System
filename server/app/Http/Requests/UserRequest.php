<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {

        $user = User::find($this->route('user'));

        return [
            'name' => ['required', 'string', 'max:255'],

            'email' => [
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($user?->id),
            ],
            'phone' => [
                'nullable',
                'string',
                'phone:PH',
                'max:20',
                Rule::unique('users', 'phone')->ignore($user?->id),
            ],
            'role' => [
                'required',
                Rule::enum(UserRole::class),
            ],

            'password' => [
                $this->isMethod('post') ? 'required' : 'nullable',
                'string',
                Password::min(8)->mixedCase()->numbers()->symbols(),
                'confirmed',
            ],

            'password_confirmation' => [
                $this->isMethod('post') ? 'required' : 'nullable',
                'string',
                Password::min(8)->mixedCase()->numbers()->symbols(),
            ],

            'avatar' => ['nullable', 'image', 'max:25000'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.phone' => 'The provided number is not a valid contact format for the Philippines.',
            'phone.max' => 'The contact number must not exceed 20 characters.',
            'avatar.image' => 'The profile picture must be a valid image file (jpeg, png, bmp, gif, or svg).',
            'avatar.max' => 'The image size is too large. Please upload an avatar smaller than 25MB.',
        ];
    }
}
