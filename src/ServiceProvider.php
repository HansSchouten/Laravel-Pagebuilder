<?php

namespace HansSchouten\LaravelPageBuilder;

class ServiceProvider extends \Illuminate\Support\ServiceProvider
{
    /**
     * Register services.
     *
     * @return void
     */
    public function register()
    {
    }

    /**
     * Bootstrap services.
     *
     * @return void
     */
    public function boot()
    {
        $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');
        $this->loadMigrationsFrom(__DIR__ . '/../migrations');

        $this->publishes([
            __DIR__ . '/../config/pagebuilder.php' => config_path('pagebuilder.php'),
        ], 'config');

        $this->publishes([
            __DIR__ . '/../themes/demo' => base_path(config('pagebuilder.theme.folder_url') . '/demo'),
        ], 'demo-theme');
    }
}
