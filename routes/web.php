<?php

use Illuminate\Support\Facades\Route;
use HansSchouten\LaravelPageBuilder\LaravelPageBuilder;

Route::get(config('pagebuilder.project.pagebuilder_url'), function() {

    $builder = new LaravelPageBuilder(config('pagebuilder'));
    $route = $_GET['route'] ?? null;
    $action = $_GET['action'] ?? null;

    if (phpb_config('login.use_login')) {
        $builder->getLogin()->handleRequest($route, $action);
    }
    if (phpb_config('website_manager.use_website_manager')) {
        $builder->getWebsiteManager()->handleRequest($route, $action);
    }
    $builder->getPageBuilder()->handleRequest($route, $action);

});