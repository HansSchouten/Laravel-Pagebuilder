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
        navigator: 'Navigator',
        column: 'Column',
        history: 'History',
        noHistory: 'Nothing has been saved yet.',
        autosave: 'Draft',
        current: 'On the site',
        draftSaved: 'Draft kept',
    }, window.phpbEnhancementLabels || {});

    /*
     * What the host application can supply (all optional), as window.phpbEnhancements:
     *   autosaveUrl    where a draft is posted, in the same form as a save
     *   autosaveEvery  seconds between drafts (default 60)
     *   revisions      [{id, kind: 'save'|'autosave', when, who, url, current}], newest first
     *   notice         a message to show when the editor opens
     *   pending        {text, label, url}: unsaved work waiting to be opened
     * A save or draft request may answer with {revisions: [...]} to refresh the list.
     */
    const host = window.phpbEnhancements || {};

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

        if (Array.isArray(host.revisions)) {
            const $past = group();
            button($past, 'history', 'fa-history', function () { toggleHistory(); });
            buttons.history.attr({ 'aria-haspopup': 'true', 'aria-expanded': 'false' });
            $('<span id="phpb-draft-status" role="status"></span>').appendTo($past);
        }

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

    /* ------------------------------------------------------------------ navigator */

    /*
     * A fourth tab in the sidebar: the page as a tree of its sections, columns and widgets.
     * PHPageBuilder hides every component from GrapesJS's layer list; the ones a person can
     * act on (blocks, and the columns that hold them) are put back, with readable names.
     */
    function contentContainers() {
        return editor.getWrapper().find('[phpb-content-container]');
    }

    function blockTitle(slug) {
        const block = window.themeBlocks && window.themeBlocks[slug];

        return block ? $('<div>').html(block.label).text().trim() : slug;
    }

    let renamed = false;

    function nameLayers(component) {
        let shown = false;

        component.components().forEach(function (child) {
            shown = nameLayers(child) || shown;
        });

        const slug = component.attributes['block-slug'];
        const isColumn = 'phpb-blocks-container' in component.getAttributes();
        const isPage = 'phpb-content-container' in component.getAttributes();
        const show = shown || slug !== undefined || isColumn || isPage;

        // Only ever write a change: these writes fire the same events this runs on.
        if (component.get('layerable') !== show) {
            component.set('layerable', show);
            renamed = true;
        }
        const name = slug !== undefined ? blockTitle(slug) : (isColumn ? labels.column : null);
        if (name && component.get('custom-name') !== name) {
            component.set('custom-name', name);
            renamed = true;
        }

        return show;
    }

    /* The tree is drawn closed; open its first level, so the page's sections are in view straight away. */
    function openNavigatorRoot() {
        setTimeout(function () {
            const $root = $('.gjs-layer').first();
            if ($root.length && !$root.hasClass('open')) {
                $root.find('[data-toggle-open]').first().trigger('click');
            }
        }, 60);
    }

    let naming = null;
    function refreshNavigator() {
        clearTimeout(naming);
        naming = setTimeout(function () {
            renamed = false;
            contentContainers().forEach(nameLayers);

            // The tree draws a name once; draw it again when names or membership changed.
            if (renamed && editor.Commands.isActive('open-layers')) {
                editor.LayerManager.render();
                openNavigatorRoot();
            }
        }, 250);
    }

    function addNavigator() {
        if (editor.Panels.getButton('views', 'open-layers-button')) {
            return;
        }

        // GrapesJS names a layer after its tag ("Box" for a div) before it looks at the name a
        // component was given. Blank those out, so given names show.
        const tags = {};
        ['', 'wrapper', 'text', 'comment', 'image', 'video', 'label', 'link', 'map', 'tfoot', 'tbody', 'thead', 'table', 'row', 'cell', 'div', 'section'].forEach(function (tag) {
            tags[tag] = '';
        });
        const names = {};
        names[editor.I18n.getLocale()] = { domComponents: { names: tags } };
        editor.I18n.addMessages(names);

        editor.Panels.addButton('views', {
            id: 'open-layers-button',
            className: 'fa fa-sitemap',
            command: 'open-layers',
            togglable: 0,
            attributes: { title: labels.navigator },
        });

        // The tree starts at the page's content, not at the theme's header and footer around it.
        editor.on('run:open-layers', function () {
            const page = contentContainers()[0];
            if (page && editor.LayerManager.setRoot) {
                editor.LayerManager.setRoot(page);
            }
            openNavigatorRoot();
            refreshNavigator();
        });

        editor.on('component:add component:remove block:drag:stop', refreshNavigator);
        $(window).on('pagebuilder-page-loaded', refreshNavigator);
        refreshNavigator();
    }

    /* -------------------------------------------------------- history and drafts */

    function renderHistory() {
        const $list = $('#phpb-history');
        if (!$list.length) {
            return;
        }
        $list.empty();

        if (!host.revisions.length) {
            $list.append($('<p class="phpb-history-empty"></p>').text(labels.noHistory));
            return;
        }

        host.revisions.forEach(function (revision) {
            const $item = $('<a></a>').attr('href', revision.url);
            $('<span class="phpb-history-when"></span>').text(revision.when).appendTo($item);
            if (revision.who) {
                $('<span class="phpb-history-who"></span>').text(revision.who).appendTo($item);
            }
            if (revision.kind === 'autosave') {
                $('<span class="phpb-history-tag"></span>').text(labels.autosave).appendTo($item);
            } else if (revision.current) {
                $('<span class="phpb-history-tag phpb-history-current"></span>').text(labels.current).appendTo($item);
            }
            $list.append($item);
        });
    }

    function toggleHistory(open) {
        let $list = $('#phpb-history');
        if (!$list.length) {
            $list = $('<div id="phpb-history" hidden></div>').attr('aria-label', labels.history).appendTo('.gjs-editor');
        }
        const show = open !== undefined ? open : $list.prop('hidden');
        if (show) {
            renderHistory();
        }
        $list.prop('hidden', !show);
        $('#phpb-toolbar [data-tool=history]').toggleClass('active', show).attr('aria-expanded', String(show));
    }

    function unsavedChanges() {
        return editor.getModel().get('changesCount') - (window.changesOffset || 0);
    }

    /*
     * Drafts reuse the editor's own save, pointed at the draft address for one request. The
     * editor then believes the page is saved, so its count of unsaved changes is put back:
     * leaving the page still warns until a real save.
     */
    let drafting = false;
    let draftedAt = null;

    function saveDraft() {
        const $save = $('#save-page');
        if (drafting || !host.autosaveUrl || !$save.length || !window.afterInitialRendering) {
            return;
        }
        const changes = editor.getModel().get('changesCount');
        if (unsavedChanges() <= 0 || changes === draftedAt) {
            return;
        }

        drafting = true;
        const saveUrl = $save.data('url');
        const offset = window.changesOffset || 0;
        const success = window.toastr.success;
        window.toastr.success = function () {};
        $save.data('url', host.autosaveUrl);

        $(document).one('ajaxComplete', function restore(event, xhr, settings) {
            if (settings.url !== host.autosaveUrl) {
                $(document).one('ajaxComplete', restore);
                return;
            }
            $save.data('url', saveUrl);
            window.toastr.success = success;

            if (xhr.status >= 200 && xhr.status < 300) {
                draftedAt = changes;
                const answer = xhr.responseJSON || {};
                $('#phpb-draft-status').text(labels.draftSaved + (answer.autosaved ? ' ' + answer.autosaved.split(', ').pop() : ''));
            }
            // After the editor's own handler has declared everything saved.
            setTimeout(function () {
                window.changesOffset = offset;
                drafting = false;
            }, 400);
        });

        $save.trigger('click');
    }

    function watchSaves() {
        // Any save or draft may hand back the refreshed history.
        $(document).on('ajaxSuccess', function (event, xhr) {
            const answer = xhr.responseJSON;
            if (answer && Array.isArray(answer.revisions)) {
                host.revisions = answer.revisions;
                renderHistory();
            }
        });

        // A real save makes the draft note stale.
        $('#save-page').on('click', function () {
            if (!drafting) {
                $('#phpb-draft-status').text('');
            }
        });

        $(document).on('keydown', function (event) {
            if (event.key === 'Escape') {
                toggleHistory(false);
            }
        });

        if (host.autosaveUrl) {
            setInterval(saveDraft, Math.max(15, Number(host.autosaveEvery) || 60) * 1000);
            window.phpbSaveDraft = saveDraft;
        }
    }

    function showNotices() {
        if (!window.toastr) {
            return;
        }
        const sticky = { timeOut: 0, extendedTimeOut: 0, closeButton: true, tapToDismiss: false };

        if (host.notice) {
            window.toastr.info($('<span>').text(host.notice).html(), '', sticky);
        }
        if (host.pending) {
            const $message = $('<span>').text(host.pending.text + ' ')
                .append($('<a style="text-decoration: underline; color: inherit;"></a>').attr('href', host.pending.url).text(host.pending.label));
            window.toastr.warning($message.html(), '', sticky);
        }
    }

    function start() {
        registerDevices();
        addStyleSectors();
        buildToolbar();
        addNavigator();

        if (Array.isArray(host.revisions)) {
            watchSaves();
        }
        showNotices();
    }

    $(function () {
        if (window.grapesJSLoaded) {
            start();
        } else {
            editor.on('load', start);
        }
    });
})(window.jQuery);
