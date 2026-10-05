# Laravel-Pagebuilder
> A drag and drop pagebuilder to manage pages in any Laravel project.

Laravel Pagebuilder is built on [PHPageBuilder](https://github.com/HansSchouten/PHPagebuilder). It integrates the most popular open source drag and drop pagebuilder: [GrapesJS](https://grapesjs.com/). This package is made with customization in mind, allowing you to configure, disable or replace any of its modules.

![PageBuilder](https://github.com/HansSchouten/Laravel-Pagebuilder/assets/5946444/63c9186f-e29d-41e0-bb11-565e7b26654b)

## Installation

Follow these steps to install Laravel Pagebuilder in your project:
- `composer require hansschouten/laravel-pagebuilder`
- `php artisan vendor:publish --provider="HansSchouten\LaravelPageBuilder\ServiceProvider" --tag=config`
- Update the configuration in `config/pagebuilder.php`
- `php artisan migrate`

Next, you need to create a theme:
- `php artisan pagebuilder:create-theme [name here]`

.. or publish the demo theme:
- `php artisan pagebuilder:publish-demo`

Now you are able to login via `/admin` with `admin` and `changethispassword` (the admin URL and credentials can be changed in the pagebuilder config file).

Visit the [PHPageBuilder repository](https://github.com/HansSchouten/PHPagebuilder#create-a-theme) for detailed information on how to develop themes.

## Editor enhancements (this fork)

This fork adds a few things to the PHPageBuilder editor without changing PHPageBuilder itself.
They live in `resources/editor/` and are handed to the page builder through its own
`customStyle()` / `customScripts()` hooks:

```php
use HansSchouten\LaravelPageBuilder\Editor\Enhancements;

$pageBuilder->customStyle(Enhancements::style());
$pageBuilder->customScripts('head', Enhancements::head());
$pageBuilder->customScripts('body', Enhancements::script());
```

- **Toolbar** above the canvas: undo, redo, desktop / tablet / phone widths, outlines on or off, preview, view code.
- **Style panel**: typography (size, weight, line height, letter spacing, colour, decoration, capitals), borders (radius, border) and effects (opacity, shadow).
- **Start-up fix**: PHPageBuilder can call `window.setWaiting()` before it has defined it when the canvas loads quickly; `Enhancements::head()` defines it up front.

`Enhancements::script(['undo' => 'Annuler', ...])` replaces the wording of the toolbar and style groups.
