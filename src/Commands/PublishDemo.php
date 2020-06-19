<?php

namespace HansSchouten\LaravelPageBuilder\Commands;

use Illuminate\Console\Command;
use Exception;
use Illuminate\Support\Facades\Artisan;

class PublishDemo extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pagebuilder:publish-demo';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Publish the demo theme.';

    /**
     * Execute the console command.
     *
     * @throws Exception
     */
    public function handle()
    {
        Artisan::call('vendor:publish', [
            '--provider' => 'HansSchouten\LaravelPageBuilder\ServiceProvider',
            '--tag' => 'demo-theme'
        ]);
        Artisan::call('pagebuilder:publish-theme', ['theme' => 'demo']);
    }

}
