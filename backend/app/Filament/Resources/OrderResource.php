<?php

namespace App\Filament\Resources;

use App\Filament\Resources\OrderResource\Pages;
use App\Filament\Resources\OrderResource\RelationManagers\ItemsRelationManager;
use App\Models\Order;
use App\Services\OrderService;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class OrderResource extends Resource
{
    protected static ?string $model = Order::class;

    protected static ?string $navigationIcon = 'heroicon-o-shopping-bag';

    protected static ?string $navigationLabel = 'Siparişler';

    protected static ?string $modelLabel = 'sipariş';

    protected static ?string $pluralModelLabel = 'siparişler';

    private const STATUS_LABELS = [
        'pending' => 'Beklemede',
        'confirmed' => 'Onaylandı',
        'shipped' => 'Kargoya Verildi',
        'delivered' => 'Teslim Edildi',
        'cancelled' => 'İptal Edildi',
        'refunded' => 'İade Edildi',
    ];

    private const STATUS_COLORS = [
        'pending' => 'warning',
        'confirmed' => 'info',
        'shipped' => 'primary',
        'delivered' => 'success',
        'cancelled' => 'danger',
        'refunded' => 'gray',
    ];

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Sipariş Bilgisi')
                ->schema([
                    Forms\Components\TextInput::make('order_number')->label('Sipariş No')->disabled(),
                    Forms\Components\TextInput::make('email')->label('E-posta')->disabled(),
                    Forms\Components\TextInput::make('phone')->label('Telefon')->disabled(),
                    Forms\Components\Select::make('payment_status')
                        ->label('Ödeme Durumu')
                        ->options(['unpaid' => 'Ödenmedi', 'paid' => 'Ödendi', 'refunded' => 'İade Edildi'])
                        ->required(),
                    Forms\Components\TextInput::make('tracking_number')->label('Kargo Takip No'),
                    Forms\Components\Textarea::make('admin_note')->label('Yönetici Notu')->columnSpanFull(),
                ])
                ->columns(2),
            Forms\Components\Section::make('Teslimat Adresi')
                ->schema([
                    Forms\Components\TextInput::make('shipping_name')->label('Ad Soyad')->disabled(),
                    Forms\Components\TextInput::make('shipping_phone')->label('Telefon')->disabled(),
                    Forms\Components\TextInput::make('shipping_line1')->label('Adres')->disabled()->columnSpanFull(),
                    Forms\Components\TextInput::make('shipping_district')->label('İlçe')->disabled(),
                    Forms\Components\TextInput::make('shipping_city')->label('Şehir')->disabled(),
                ])
                ->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('order_number')->label('Sipariş No')->searchable(),
                Tables\Columns\TextColumn::make('email')->label('Müşteri')->searchable(),
                Tables\Columns\TextColumn::make('total_minor')
                    ->label('Toplam')
                    ->formatStateUsing(fn ($state) => number_format($state / 100, 2, ',', '.').' ₺')
                    ->sortable(),
                Tables\Columns\TextColumn::make('status')
                    ->label('Durum')
                    ->badge()
                    ->formatStateUsing(fn ($state) => self::STATUS_LABELS[$state])
                    ->color(fn ($state) => self::STATUS_COLORS[$state]),
                Tables\Columns\TextColumn::make('payment_status')
                    ->label('Ödeme')
                    ->badge()
                    ->formatStateUsing(fn ($state) => match ($state) {
                        'unpaid' => 'Ödenmedi', 'paid' => 'Ödendi', 'refunded' => 'İade Edildi',
                    }),
                Tables\Columns\TextColumn::make('created_at')->label('Tarih')->dateTime('d.m.Y H:i')->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Durum')
                    ->options(self::STATUS_LABELS),
                Tables\Filters\SelectFilter::make('payment_status')
                    ->label('Ödeme Durumu')
                    ->options(['unpaid' => 'Ödenmedi', 'paid' => 'Ödendi', 'refunded' => 'İade Edildi']),
            ])
            ->actions([
                Tables\Actions\Action::make('confirm')
                    ->label('Onayla')
                    ->icon('heroicon-o-check-circle')
                    ->visible(fn (Order $record) => $record->status === 'pending')
                    ->action(fn (Order $record) => app(OrderService::class)->updateByAdmin($record, ['status' => 'confirmed'])),
                Tables\Actions\Action::make('ship')
                    ->label('Kargola')
                    ->icon('heroicon-o-truck')
                    ->visible(fn (Order $record) => $record->status === 'confirmed')
                    ->form([
                        Forms\Components\TextInput::make('tracking_number')->label('Kargo Takip No')->required(),
                    ])
                    ->action(fn (Order $record, array $data) => app(OrderService::class)->updateByAdmin($record, [
                        'status' => 'shipped',
                        'tracking_number' => $data['tracking_number'],
                    ])),
                Tables\Actions\Action::make('deliver')
                    ->label('Teslim Edildi')
                    ->icon('heroicon-o-check-badge')
                    ->visible(fn (Order $record) => $record->status === 'shipped')
                    ->action(fn (Order $record) => app(OrderService::class)->updateByAdmin($record, ['status' => 'delivered'])),
                Tables\Actions\Action::make('cancel')
                    ->label('İptal Et')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn (Order $record) => in_array($record->status, ['pending', 'confirmed'], true))
                    ->action(function (Order $record) {
                        app(OrderService::class)->updateByAdmin($record, ['status' => 'cancelled']);
                        Notification::make()->title('Sipariş iptal edildi, stok geri yüklendi.')->success()->send();
                    }),
                Tables\Actions\EditAction::make(),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            ItemsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListOrders::route('/'),
            'edit' => Pages\EditOrder::route('/{record}/edit'),
        ];
    }
}
