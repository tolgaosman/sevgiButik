<?php

use App\Http\Middleware\EnsureUserIsAdmin;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\StartSession;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        /*
         * The API is consumed by exactly one client: the Next.js storefront,
         * which proxies every browser call to /api same-origin. Cart tokens and
         * auth both live in the session, so the session must always be there —
         * Sanctum's statefulApi() only starts it when Referer/Origin matches
         * SANCTUM_STATEFUL_DOMAINS, and a header the browser is free to omit is
         * not something request handling may depend on. Session auth still
         * satisfies auth:sanctum: Sanctum's guard falls back to the web guard.
         */
        $middleware->api(prepend: [
            EncryptCookies::class,
            AddQueuedCookiesToResponse::class,
            StartSession::class,
            ValidateCsrfToken::class,
        ]);

        $middleware->alias(['admin' => EnsureUserIsAdmin::class]);

        /*
         * Every request to Laravel arrives via the Next.js frontend container
         * (Docker-internal network only — the backend publishes no port of
         * its own), so that hop is always safe to trust for X-Forwarded-*.
         * Without this, $request->ip() is always the frontend container's
         * IP, which collapses every visitor onto one rate-limit bucket.
         */
        $middleware->trustProxies(at: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16']);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
