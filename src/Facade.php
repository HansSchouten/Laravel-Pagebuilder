<?php

namespace HansSchouten\PageBuilder;

/**
 * @see \HansSchouten\PageBuilder\LaravelPageBuilder
 */
class Facade extends \Illuminate\Support\Facades\Facade
{
    /**
     * {@inheritDoc}
     */
    protected static function getFacadeAccessor()
    {
        return LaravelPageBuilder::class;
    }
}
