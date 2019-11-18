<?php

use Illuminate\Support\Facades\Route;
use HansSchouten\LaravelPageBuilder\LaravelPageBuilder;

// pass all requests to LaravelPageBuilder
Route::any( '/{any}', function() {

    $builder = new LaravelPageBuilder(config('pagebuilder'));
    $builder->handleRequest();

})->where('any', '.*');