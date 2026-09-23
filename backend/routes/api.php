<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\NewsletterController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReviewController;
use Illuminate\Support\Facades\Route;

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/homepage', [\App\Http\Controllers\Api\SettingController::class, 'getHomepageData']);
Route::get('/settings/store', [\App\Http\Controllers\Api\SettingController::class, 'getStoreSettings']);

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/slugs', [ProductController::class, 'slugs']);
Route::get('/products/best-sellers', [ProductController::class, 'bestSellers']);
Route::get('/products/{slug}/related', [ProductController::class, 'related']);
Route::get('/products/{slug}/reviews', [ReviewController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/password/forgot', [AuthController::class, 'forgotPassword']);
Route::post('/password/reset', [AuthController::class, 'resetPassword'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::patch('/user', [AuthController::class, 'updateProfile']);
    Route::put('/user/password', [AuthController::class, 'updatePassword']);
    Route::delete('/user', [AuthController::class, 'destroy']);

    Route::get('/products/{slug}/eligible-orders', [ReviewController::class, 'eligibleOrders']);
    Route::post('/products/{slug}/reviews', [ReviewController::class, 'store']);

    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::post('/favorites', [FavoriteController::class, 'store']);
    Route::delete('/favorites/{slug}', [FavoriteController::class, 'destroy']);
    Route::post('/favorites/merge', [FavoriteController::class, 'merge']);

    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{orderNumber}', [OrderController::class, 'show']);
    Route::post('/orders/{orderNumber}/cancel', [OrderController::class, 'cancel']);
    Route::post('/orders', [OrderController::class, 'store']);
});

Route::get('/cart', [CartController::class, 'show']);
Route::post('/cart/items', [CartController::class, 'store']);
Route::patch('/cart/items/{item}', [CartController::class, 'update']);
Route::delete('/cart/items/{item}', [CartController::class, 'destroy']);
Route::delete('/cart', [CartController::class, 'clear']);


Route::post('/orders/track', [OrderController::class, 'track']);

Route::post('/contact', [ContactController::class, 'store']);

Route::post('/newsletter', [NewsletterController::class, 'store'])->middleware('throttle:10,1');
Route::get('/newsletter/unsubscribe/{token}', [NewsletterController::class, 'unsubscribe']);

// Admin Routes — session auth (auth:sanctum falls back to the web guard)
// plus an is_admin check; the Next.js panel at /admin_login is the only client.
Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/orders', [\App\Http\Controllers\Api\Admin\OrderController::class, 'index']);
    Route::put('/orders/{orderNumber}', [\App\Http\Controllers\Api\Admin\OrderController::class, 'update']);
    
    Route::get('/customers', [\App\Http\Controllers\Api\Admin\CustomerController::class, 'index']);
    Route::put('/customers/{id}', [\App\Http\Controllers\Api\Admin\CustomerController::class, 'update']);
    
    Route::get('/categories', [\App\Http\Controllers\Api\Admin\CategoryController::class, 'index']);
    Route::post('/categories', [\App\Http\Controllers\Api\Admin\CategoryController::class, 'store']);
    Route::put('/categories/{id}', [\App\Http\Controllers\Api\Admin\CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [\App\Http\Controllers\Api\Admin\CategoryController::class, 'destroy']);
    
    Route::get('/products', [\App\Http\Controllers\Api\Admin\ProductController::class, 'index']);
    Route::post('/products', [\App\Http\Controllers\Api\Admin\ProductController::class, 'store']);
    Route::put('/products/{id}', [\App\Http\Controllers\Api\Admin\ProductController::class, 'update']);
    Route::delete('/products/{id}', [\App\Http\Controllers\Api\Admin\ProductController::class, 'destroy']);
    Route::delete('/products/{id}/images/{imageId}', [\App\Http\Controllers\Api\Admin\ProductController::class, 'destroyImage']);
    
    Route::get('/settings/homepage', [\App\Http\Controllers\Api\SettingController::class, 'getHomepageSettings']);
    Route::put('/settings/homepage', [\App\Http\Controllers\Api\SettingController::class, 'updateHomepageSettings']);
    Route::put('/settings/store', [\App\Http\Controllers\Api\SettingController::class, 'updateStoreSettings']);

    Route::get('/reviews', [\App\Http\Controllers\Api\Admin\ReviewController::class, 'index']);
    Route::put('/reviews/{review}', [\App\Http\Controllers\Api\Admin\ReviewController::class, 'update']);
    Route::delete('/reviews/{review}', [\App\Http\Controllers\Api\Admin\ReviewController::class, 'destroy']);
});
