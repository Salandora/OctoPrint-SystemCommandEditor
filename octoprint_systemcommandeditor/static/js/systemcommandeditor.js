$(function() {
    function SystemCommandEditorViewModel() {
        let self = this;

        self.originalData = [];
        self.systemActions = ko.observableArray([]);

        self.dividerID = 0;
        self.popup = undefined;

        self.history = new UndoRedoHistory();

        self.hasUndo = ko.observable(false);
        self.hasRedo = ko.observable(false);

        // Editor variables
        self.editorTitle = ko.observable(gettext("Create Command"));
        self.editorName = ko.observable("");
        self.editorAction = ko.observable("");
        self.editorCommand = ko.observable("");
        self.editorUseConfirm = ko.observable(false);
        self.editorConfirm = ko.observable("");
        self.editorErrorMessageName = ko.observable("");
        self.editorErrorMessageAction = ko.observable("");

        self.undo = function() {
            self.history.undo();
        };
        self.redo = function() {
            self.history.redo();
        };

        self.requestData = function () {
            OctoPrint.system.getCommandsForSource("custom").done(function(response) {
                self.originalData = response || [];
                self.processData();
            });
        };

        self.processData = function() {
            self.dividerID = 0;

            const array = [];
            _.each(self.originalData, function(e) {
                let element = {};

                if (!e.action.startsWith("divider")) {
                    element = _.extend(element, {
                        name: e.name,
                        action: e.action,
                        command: e.command
                    });

                    if (e.hasOwnProperty("confirm"))
                        element.confirm = e.confirm;
                }
                else
                {
                    e.action = "divider" + (++self.dividerID);
                    element.action = e.action;
                }
                array.push(element);
            });

            self.systemActions(array);

            self.history.values().forEach(function(e) {
                self.processAction(e);
            });
        };

        self.processAction = function(entry) {
            self.hasUndo(self.history.hasUndo());
            self.hasRedo(self.history.hasRedo());

            if (entry.action === 'add') {
                self.systemActions.splice(entry.data.index, 0, entry.data.element);
            }
            else if (entry.action === 'remove') {
                self.systemActions.splice(entry.data.index, 1);
            }
            else if (entry.action === 'edit') {
                let newData = entry.data;
                const element = self.systemActions()[newData.index];

                if (newData.hasOwnProperty("name"))
                    element.name = newData.name;

                if (newData.hasOwnProperty("action"))
                    element.action = newData.action;

                if (newData.hasOwnProperty("command"))
                    element.command = newData.command;

                if (newData.hasOwnProperty("confirm"))
                {
                    if (newData.confirm === undefined)
                        delete element.confirm;
                    else
                        element.confirm = newData.confirm;
                }
            }
            else if (entry.action === 'move') {
                const elementIndex = entry.data.oldIndex;
                const element = self.systemActions()[elementIndex];

                self.systemActions.splice(elementIndex, 1);
                self.systemActions.splice(entry.data.newIndex, 0, element);
            }
        };

        self._showPopup = function (options, eventListeners) {
            if (self.popup !== undefined) {
                self.popup.remove();
            }
            self.popup = new PNotify(options);

            if (eventListeners) {
                const popupObj = self.popup.get();
                _.each(eventListeners, function (value, key) {
                    popupObj.on(key, value);
                })
            }
        };

        let _actionIndex = function(actionName) {
            return self.systemActions().findIndex(e => e.action === actionName);
        }

        self.createElement = function (index) {
            const actionIndex = _.isFunction(index) ? index()+1 : 0;
            self.resetEditorDialog();
            self.editorTitle(gettext("Create Command"));

            self.showEditorDialog(function (ret) {
                self.history.push(new HistoryNode('add', { index: actionIndex, element: ret }));
            });
        };
        self.createDivider = function(index) {
            const actionIndex = _.isFunction(index) ? index()+1 : 0;
            self.history.push(new HistoryNode('add', { index: actionIndex, element: { action: "divider" }}));
        };
        self.deleteElement = function (index) {
            const actionIndex = index();
            if (actionIndex === -1) {
                self._showPopup({
                    title: gettext("Something went wrong while creating the new Element"),
                    type: "error"
                });
                return;
            }
            self.history.push(new HistoryNode('remove', { index: actionIndex }));
        };
        self.editElement = function (index) {
            const actionIndex = index();
            if (actionIndex === -1) {
                self._showPopup({
                    title: gettext("Something went wrong while editing the element"),
                    type: "error"
                });
                return;
            }

            const element = self.systemActions()[actionIndex];
            self.resetEditorDialog(element);
            self.editorTitle(gettext("Edit Command"));

            self.showEditorDialog(function (ret) {
                const newData = { index: actionIndex };

                if (element.name !== ret.name)
                    newData.name = ret.name;

                if (element.action !== ret.action)
                    newData.action = ret.action;

                if (element.command !== ret.command)
                    newData.command = ret.command;

                if (ret.hasOwnProperty("confirm"))
                    newData.confirm = ret.confirm;
                else if (element.hasOwnProperty("confirm"))
                    newData.confirm = undefined;

                self.history.push(new HistoryNode('edit', newData));
            });
        };

        self.resetEditorDialog = function (data) {
            self.editorName("");
            self.editorAction("");
            self.editorCommand("");
            self.editorConfirm("");

            self.editorErrorMessageName("");
            self.editorErrorMessageAction("");

            if (data !== undefined) {
                if (data.name !== undefined)
                    self.editorName(data.name);
                if (data.action !== undefined)
                    self.editorAction(data.action);
                if (data.command !== undefined)
                    self.editorCommand(data.command);

                self.editorUseConfirm(data.hasOwnProperty("confirm"));
                if (data.confirm !== undefined)
                    self.editorConfirm(data.confirm);
            }
        };
        self.showEditorDialog = function (callback) {
            const dialog = $("#systemCommandEditorDialog");
            const from = $('#systemCommandEditorDialogForm', dialog);

            from.off('submit').on('submit', function (e) {
                const name = $('#systemCommandEditorDialog_Name');
                const action = $('#systemCommandEditorDialog_Action');

                self.editorErrorMessageName("");
                self.editorErrorMessageAction("");
                name.closest('.control-group').removeClass('error');
                action.closest('.control-group').removeClass('error');

                let error = false;
                if (self.editorName() === "") {
                    self.editorErrorMessageName(gettext("Name is mandatory!"));
                    name.closest('.control-group').addClass('error');

                    error = true;
                }
                if (self.editorAction() === "") {
                    self.editorErrorMessageAction(gettext("Action is mandatory!"));
                    action.closest('.control-group').addClass('error');

                    error = true;
                }
                if (_actionIndex(self.editorAction()) !== -1)
                {
                    self.editorErrorMessageAction(gettext("Action name must be unique!"));
                    action.closest('.control-group').addClass('error');

                    error = true;
                }

                if (error) {
                    e.preventDefault();
                    return;
                }

                dialog.modal('hide');

                let element = {
                    name: self.editorName(),
                    action: self.editorAction(),
                    command: self.editorCommand(),
                    confirm: self.editorConfirm()
                };

                if (!self.editorUseConfirm())
                    delete element.confirm;

                callback(element);
            });

            dialog.modal({
                show: 'true',
                backdrop: 'static',
                keyboard: false
            });
        };

        self.onBeforeBinding = function () {
            self.history.off("add").on("add", self.processAction);
            self.history.off("undo").on("undo", self.processData);
            self.history.off("redo").on("redo", self.processData);

            $("#systemActions>table").sortable({
                items: '> tbody > tr:not(.static)',
                cursor: 'move',
                update: function(event, ui) {
                    const data = ko.dataFor(ui.item[0]);
                    const oldIndex = self.systemActions().findIndex(e => e.action === data.action);

                    const newIndex = ko.utils.arrayIndexOf(ui.item.parent().children(), ui.item[0]) - 1;
                    if (newIndex >= 0) {
                        self.history.push(new HistoryNode('move', { oldIndex: oldIndex, newIndex: newIndex }));
                    }
                    ui.item.remove();
                },
                start: function(){
                    $('.static', this).each(function(){
                        const $this = $(this);
                        $this.data('pos', $this.index());
                    });
                },
                change: function(){
                    $sortable = $(this);
                    $statics = $('.static', this).detach();
                    $helper = $('<tr></tr>').prependTo(this);
                    $statics.each(function(){
                        const $this = $(this);
                        const target = $this.data('pos');

                        $this.insertAfter($('tr', $sortable).eq(target));
                    });
                    $helper.remove();
                }
            });
        };

        self.onSettingsShown = function () {
            self.requestData();
        };

        self.onSettingsHidden = function () {
            self.history.clear();
            self.hasUndo(false);
            self.hasRedo(false);
        };

        self.onSettingsBeforeSave = function () {
            OctoPrint.plugins.systemcommandeditor.update(self.history.values());
        };

        self.onEventSettingsUpdated = function () {
            self.requestData();
        };
    }

    // view model class, parameters for constructor, container to bind to
    OCTOPRINT_VIEWMODELS.push([
        SystemCommandEditorViewModel,
        [],
        ["#settings_plugin_systemcommandeditor", "#systemCommandEditorDialog"]
    ]);
});