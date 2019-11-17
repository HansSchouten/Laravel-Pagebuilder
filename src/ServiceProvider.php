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
        $this->publishes([
            __DIR__ . '/../config/pagebuilder.php' => config_path('pagebuilder.php'),
        ]);

        $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');
    }
}
