<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\EmailOtp;
use App\Models\User;
use App\Services\CartService;
use App\Support\Phone;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        private readonly CartService $carts,
    ) {}

    public function register(Request $request): UserResource
    {
        if ($request->has('phone') && $request->filled('phone')) {
            $request->merge(['phone' => Phone::normalize((string) $request->input('phone'))]);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => ['required', 'regex:/^5\d{9}$/', 'unique:users,phone'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ], [
            'phone.regex' => 'Geçerli bir telefon numarası girin (Örn. 5XX XXX XX XX).',
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'password' => Hash::make($data['password']),
        ]);

        event(new Registered($user));

        try {
            \Illuminate\Support\Facades\Mail::to($user->email)->queue(new \App\Mail\WelcomeEmail($user));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Welcome email failed: ' . $e->getMessage());
        }

        $this->loginAndMergeCart($request, $user);

        return new UserResource($user);
    }

    public function login(Request $request): UserResource
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);
        
        $credentials = ['email' => $data['email'], 'password' => $data['password']];
        $key = Str::lower($data['email']).'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages([
                'email' => 'Çok fazla deneme yapıldı. Lütfen birazdan tekrar deneyin.',
            ]);
        }

        if (! Auth::attempt($credentials)) {
            RateLimiter::hit($key, 60);
            throw ValidationException::withMessages(['email' => 'E-posta veya şifre hatalı.']);
        }

        RateLimiter::clear($key);

        $user = Auth::user();
        $this->loginAndMergeCart($request, $user, alreadyAuthenticated: true);

        return new UserResource($user);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(null, 204);
    }

    public function user(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    public function updateProfile(Request $request): UserResource
    {
        $user = $request->user();

        if ($request->filled('phone')) {
            $request->merge(['phone' => Phone::normalize((string) $request->input('phone'))]);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,'.$user->id,
            'phone' => ['sometimes', 'required', 'regex:/^5\d{9}$/', 'unique:users,phone,'.$user->id],
        ], [
            'phone.required' => 'Telefon numarası zorunludur.',
            'phone.regex' => 'Geçerli bir telefon numarası girin (Örn. 5XX XXX XX XX).',
        ]);

        $user->update($data);

        return new UserResource($user);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => 'required|current_password',
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = $request->user();
        $user->update(['password' => Hash::make($data['password'])]);

        // Drop every other session for this account — the current one is
        // exempt so changing your own password doesn't log you out too.
        \Illuminate\Support\Facades\DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('id', '!=', $request->session()->getId())
            ->delete();

        return response()->json(null, 204);
    }

    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $user->delete();

        return response()->json(null, 204);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email',
        ]);

        $key = 'otp-request:'.Str::lower($data['email']);

        if (RateLimiter::tooManyAttempts($key, 3)) {
            return response()->json(['message' => 'Çok fazla deneme yapıldı. Lütfen birazdan tekrar deneyin.'], 429);
        }

        RateLimiter::hit($key, 300);

        $user = User::where('email', $data['email'])->first();

        if ($user) {
            $code = EmailOtp::issue($data['email']);
            try {
                \Illuminate\Support\Facades\Mail::to($data['email'])->send(new \App\Mail\ResetPasswordOtp($code));
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Reset password email failed: ' . $e->getMessage());
            }
        }

        return response()->json(['message' => 'E-posta adresiniz kayıtlıysa doğrulama kodu gönderildi.']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email',
            'code' => 'required|string',
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! EmailOtp::verify($data['email'], $data['code'])) {
            throw ValidationException::withMessages([
                'code' => 'Doğrulama kodu hatalı veya süresi dolmuş.',
            ]);
        }

        $user->update(['password' => Hash::make($data['password'])]);

        // An OTP reset can be someone recovering a compromised account —
        // every existing session (including a possible attacker's) must go.
        \Illuminate\Support\Facades\DB::table('sessions')->where('user_id', $user->id)->delete();

        return response()->json(['message' => 'Şifreniz güncellendi.']);
    }

    /**
     * Cart tokens live in the session. The guest token must be read BEFORE
     * session()->regenerate() runs (triggered internally by Auth::login()/
     * attempt()) — regeneration is not guaranteed to preserve it, so capture
     * it first and fold the guest cart into the user's cart afterward.
     */
    private function loginAndMergeCart(Request $request, User $user, bool $alreadyAuthenticated = false): void
    {
        $guestToken = $request->session()->get('cart_token');

        if (! $alreadyAuthenticated) {
            Auth::login($user);
        }

        $request->session()->regenerate();

        if ($guestToken) {
            $this->carts->mergeGuestCartIntoUser($guestToken, $user);
        }
    }
}
