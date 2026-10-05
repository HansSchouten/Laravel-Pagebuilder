<?php

namespace HansSchouten\LaravelPageBuilder\Editor;

/**
 * Additions to the PHPageBuilder editor that ship with this package: a toolbar (undo, redo,
 * device widths, outlines, preview, view code) and extra style groups (typography, borders, effects).
 *
 * Hand all three to the page builder before it is rendered:
 *
 *     $pageBuilder->customStyle(Enhancements::style());
 *     $pageBuilder->customScripts('head', Enhancements::head());
 *     $pageBuilder->customScripts('body', Enhancements::script());
 */
class Enhancements
{
    /**
     * The stylesheet, wrapped in a <style> tag for PageBuilder::customStyle().
     */
    public static function style(): string
    {
        return '<style>'.self::read('enhancements.css').'</style>';
    }

    /**
     * A script for the <head>, wrapped in a <script> tag for PageBuilder::customScripts('head', ...).
     *
     * PHPageBuilder defines window.setWaiting() when the document is ready, but its canvas can
     * finish loading first and call it. The call then fails, and the editor never records that
     * its first drawing is done. This defines the same function up front; the editor's own
     * definition replaces it as soon as it runs.
     */
    public static function head(): string
    {
        return '<script>window.setWaiting = window.setWaiting || function (waiting) {'
            .' var wrapper = window.editor && window.editor.DomComponents.getWrapper();'
            .' if (wrapper) { waiting ? wrapper.addClass("gjs-waiting") : wrapper.removeClass("gjs-waiting"); }'
            .' };</script>';
    }

    /**
     * The script, wrapped in a <script> tag for PageBuilder::customScripts('body', ...).
     *
     * @param  array<string, string>  $labels  Replacement wording for the toolbar and style groups, by key.
     */
    public static function script(array $labels = []): string
    {
        $override = $labels
            ? 'window.phpbEnhancementLabels = '.json_encode($labels, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT).';'
            : '';

        return '<script>'.$override.self::read('enhancements.js').'</script>';
    }

    private static function read(string $file): string
    {
        // Neither file may close the tag it is printed inside.
        return str_replace(['</script', '</style'], ['<\/script', '<\/style'], (string) file_get_contents(__DIR__.'/../../resources/editor/'.$file));
    }
}
