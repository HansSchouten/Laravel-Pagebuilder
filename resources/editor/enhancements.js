/*
 * Additions to the PHPageBuilder editor, loaded after the editor's own script.
 *
 *  - a toolbar above the canvas: undo, redo, desktop / tablet / phone widths, outlines,
 *    preview and "view code";
 *  - three more groups in the style panel: typography, borders and effects.
 *
 * Everything goes through the GrapesJS instance the editor exposes as window.editor, so this
 * file needs no build step and no change to PHPageBuilder itself.
 */
(function ($) {
    'use strict';

    const editor = window.editor;
    if (!editor || !$) {
        return;
    }

    const labels = Object.assign({
        undo: 'Undo',
        redo: 'Redo',
        desktop: 'Desktop width',
        tablet: 'Tablet width',
        phone: 'Phone width',
        outlines: 'Show or hide outlines',
        preview: 'Preview without the editor',
        code: 'View the page\'s code',
        typography: 'Typography',
        borders: 'Borders',
        effects: 'Effects',
        textTransform: 'Capitals',
    }, window.phpbEnhancementLabels || {});

    /* ---------------------------------------------------------------- style panel */

    function addStyleSectors() {
        const styles = editor.StyleManager;

        if (styles.getSector('typography')) {
            return;
        }

        styles.addSector('typography', {
            name: labels.typography,
            open: false,
            buildProps: ['font-size', 'font-weight', 'line-height', 'letter-spacing', 'color', 'text-decoration'],
            properties: [{
                property: 'text-transform',
                name: labels.textTransform,
                type: 'select',
                defaults: 'none',
                list: [{ value: 'none' }, { value: 'uppercase' }, { value: 'capitalize' }, { value: 'lowercase' }],
            }],
        }, { at: 1 });

        styles.addSector('borders', {
            name: labels.borders,
            open: false,
            buildProps: ['border-radius', 'border'],
        }, { at: 3 });

        styles.addSector('effects', {
            name: labels.effects,
            open: false,
            buildProps: ['opacity', 'box-shadow'],
        }, { at: 4 });
    }

    /* -------------------------------------------------------------------- toolbar */

    const devices = [
        { id: 'desktop', name: 'Desktop', width: '', icon: 'fa-desktop' },
        { id: 'tablet', name: 'Tablet', width: '768px', icon: 'fa-tablet' },
        { id: 'phone', name: 'Phone', width: '390px', icon: 'fa-mobile' },
    ];

    function registerDevices() {
        const manager = editor.DeviceManager;

        devices.forEach(function (device) {
            if (!manager.get(device.name)) {
                manager.add(device.name, device.width);
            }
        });
    }

    function buildToolbar() {
        if (document.getElementById('phpb-toolbar')) {
            return;
        }

        const $bar = $('<div id="phpb-toolbar" role="toolbar"></div>');
        const buttons = {};

        function group() {
            return $('<span class="phpb-toolbar-group"></span>').appendTo($bar);
        }

        function button($group, id, icon, action) {
            buttons[id] = $('<button type="button"></button>')
                .attr({ 'data-tool': id, title: labels[id], 'aria-label': labels[id] })
                .append($('<i aria-hidden="true"></i>').addClass('fa ' + icon))
                .on('click', action)
                .appendTo($group);
        }

        const $history = group();
        button($history, 'undo', 'fa-undo', function () { editor.UndoManager.undo(); refresh(); });
        button($history, 'redo', 'fa-repeat', function () { editor.UndoManager.redo(); refresh(); });

        const $widths = group();
        devices.forEach(function (device) {
            button($widths, device.id, device.icon, function () {
                editor.setDevice(device.name);
                refresh();
            });
        });

        const $view = group();
        button($view, 'outlines', 'fa-square-o', function () {
            toggleCommand('sw-visibility');
            refresh();
        });
        button($view, 'preview', 'fa-eye', function () { editor.runCommand('preview'); });
        button($view, 'code', 'fa-code', function () { editor.runCommand('export-template'); });

        function toggleCommand(name) {
            if (editor.Commands.isActive(name)) {
                editor.stopCommand(name);
            } else {
                editor.runCommand(name);
            }
        }

        function refresh() {
            buttons.undo.prop('disabled', !editor.UndoManager.hasUndo());
            buttons.redo.prop('disabled', !editor.UndoManager.hasRedo());

            const current = editor.getDevice() || 'Desktop';
            devices.forEach(function (device) {
                buttons[device.id].toggleClass('active', device.name === current).attr('aria-pressed', device.name === current);
            });

            const outlined = editor.Commands.isActive('sw-visibility');
            buttons.outlines.toggleClass('active', outlined).attr('aria-pressed', outlined);
        }

        $('.gjs-editor').append($bar);

        // The outlines start switched on, so sections are easy to find and pick.
        if (!editor.Commands.isActive('sw-visibility')) {
            editor.runCommand('sw-visibility');
        }

        editor.on('update undo redo component:add component:remove component:update change:device', refresh);
        // The editor wipes the history once it has drawn the saved page; catch up afterwards.
        setTimeout(refresh, 1500);
        refresh();
    }

    function start() {
        registerDevices();
        addStyleSectors();
        buildToolbar();
    }

    $(function () {
        if (window.grapesJSLoaded) {
            start();
        } else {
            editor.on('load', start);
        }
    });
})(window.jQuery);
