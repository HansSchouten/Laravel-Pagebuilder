# Laravel-Pagebuilder
> A drag and drop pagebuilder to manage pages in any Laravel project.

Laravel Pagebuilder is built on [PHPageBuilder](https://github.com/HansSchouten/PHPagebuilder). It integrates the most popular open source drag and drop pagebuilder: [GrapesJS](https://grapesjs.com/). This package is made with customization in mind, allowing you to configure, disable or replace any of its modules.

![PageBuilder](https://user-images.githubusercontent.com/5946444/70818285-97c81a80-1dd3-11ea-84b0-2a6ff3a8765a.png)

## Installation

Follow these steps to install Laravel Pagebuilder in your project:
- `composer require hansschouten/laravel-pagebuilder`
- `php artisan vendor:publish`
- Update the configuration in `config/pagebuilder.php`
- `php artisan migrate`
- Visit [the original repository](https://github.com/HansSchouten/PHPagebuilder#create-a-theme) for info on how to create a theme
