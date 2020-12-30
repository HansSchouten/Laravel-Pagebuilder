<?php

namespace HansSchouten\LaravelPageBuilder;

use HansSchouten\LaravelPageBuilder\Commands\CreateTheme;
use HansSchouten\LaravelPageBuilder\Commands\PublishDemo;
use HansSchouten\LaravelPageBuilder\Commands\PublishTheme;
use PHPageBuilder\PHPageBuilder;
use Illuminate\Support\Arr;
use Exception;

class ServiceProvider extends \Illuminate\Support\ServiceProvider
{
    /**
     * Register services.
     *
     * @return void
     */
    public function register()
    {
        $this->setConfig('pagebuilder');
    }

    /**
     * Bootstrap services.
     *
     * @return void
     * @throws Exception
     */
    public function boot()
    {
        $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');
        $this->loadMigrationsFrom(__DIR__ . '/../migrations');

        if ($this->app->runningInConsole()) {
            $this->commands([
                CreateTheme::class,
                PublishTheme::class,
                PublishDemo::class,
            ]);
        } elseif (empty(config('pagebuilder'))) {
            throw new Exception("No PHPageBuilder config found, please run: php artisan vendor:publish --provider=\"HansSchouten\LaravelPageBuilder\ServiceProvider\" --tag=config");
        }

        // register singleton phpPageBuilder (this ensures phpb_ helpers have the right config without first manually creating a PHPageBuilder instance)
        $this->app->singleton('phpPageBuilder', function($app) {
            return new PHPageBuilder(config('pagebuilder') ?? []);
        });
        $this->app->make('phpPageBuilder');

        $this->publishes([
            __DIR__ . '/../config/pagebuilder.php' => config_path('pagebuilder.php'),
        ], 'config');
        $this->publishes([
            __DIR__ . '/../themes/demo' => base_path(config('pagebuilder.theme.folder_url') . '/demo'),
        ], 'demo-theme');
    }

    /**
     * 
     */
    protected function setConfig($name)
    {
        if(!($this->app instanceof CachesConfiguration && $this->app->configurationIsCached())) {
            $pbConfig = require config_path("{$name}.php");
            $dbConfig = $this->app['config']->get("database", []);

            $defaultDBDriver = Arr::get($dbConfig, 'default');
            $dbDriver = Arr::get($pbConfig, 'storage.database.driver', $defaultDBDriver);
            $dbConfig = $this->app['config']->get("database.connections.{$dbDriver}", []);

            $mergedDBConfig = array_merge($dbConfig, Arr::get($pbConfig, 'storage.database'));
            Arr::set($pbConfig, 'storage.database', $mergedDBConfig);

            $this->app['config']->set($name, $pbConfig);
        }
    }
}
