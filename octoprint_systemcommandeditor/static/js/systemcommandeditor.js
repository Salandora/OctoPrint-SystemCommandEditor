$(function() {
    function SystemCommandEditorViewModel(parameters) {
        var self = this;

        self.settingsViewModel = parameters[0];
        self.systemCommandEditorDialogViewModel = parameters[1];

        self.actionsFromServer = [];
        self.systemActions = ko.observableArray([]);

        self.popup = undefined;

        self.onSettingsShown = function () {
            self.requestData();
        };

        self.requestData = function () {
            self.settingsViewModel.requestData(self._fromResponse());
        };

        self._fromResponse = function () {
            self.actionsFromServer = self.settingsViewModel.system_actions() || [];
            self.rerenderActions();
        };

        self.rerenderActions = function() {
            var array = []
            _.each(self.actionsFromServer, function(e) {
                var element = {
                    name: ko.observable(e.name),
                    action: ko.observable(e.action),
                    command: ko.observable(e.command)
                };

                if (e.hasOwnProperty("confirm"))
                    element.confirm = ko.observable(e.confirm);

                array.push(element);
            })
            self.systemActions(array);

            $("#systemActions").sortable({
                items: '> li:not(.static)',
                cursor: 'move',
                axis: 'y',
                update: function(event, ui) {
                    var data = ko.dataFor(ui.item[0]);
                    var item = _.find(self.actionsFromServer, function(e) {
                        return e.action == data.action();
                    });

                    var position = ko.utils.arrayIndexOf(ui.item.parent().children(), ui.item[0]);
                    if (position >= 0) {
                        self.actionsFromServer = _.without(self.actionsFromServer, item);
                        self.actionsFromServer.splice(position, 0, item);
                    }
                    ui.item.remove();
                    self.rerenderActions();
                },
                start: function(){
                    $('.static', this).each(function(){
                        var $this = $(this);
                        $this.data('pos', $this.index());
                    });
                },
                change: function(){
                    $sortable = $(this);
                    $statics = $('.static', this).detach();
                    $helper = $('<li></li>').prependTo(this);
                    $statics.each(function(){
                        var $this = $(this);
                        var target = $this.data('pos');

                        $this.insertAfter($('li', $sortable).eq(target));
                    });
                    $helper.remove();
                }
            });
        }

        self._showPopup = function (options, eventListeners) {
            if (self.popup !== undefined) {
                self.popup.remove();
            }
            self.popup = new PNotify(options);

            if (eventListeners) {
                var popupObj = self.popup.get();
                _.each(eventListeners, function (value, key) {
                    popupObj.on(key, value);
                })
            }
        };

        self.createElement = function (invokedOn, contextParent, selectedMenu) {
            self.systemCommandEditorDialogViewModel.reset();
            self.systemCommandEditorDialogViewModel.title(gettext("Create Command"));

            self.systemCommandEditorDialogViewModel.show(function (ret) {
                self.actionsFromServer.push(ret);
                self.rerenderActions();
            });
        }
        self.deleteElement = function (invokedOn, contextParent, selectedMenu) {
            var elementID = contextParent.attr('id');
            var element = _.find(self.actionsFromServer, function(e) {
                return e.action == elementID;
            });
            if (element == undefined) {
                self._showPopup({
                    title: gettext("Something went wrong while creating the new Element"),
                    type: "error"
                });
                return;
            }

            showConfirmationDialog("", function (e) {
                self.actionsFromServer = _.without(self.actionsFromServer, element);
                self.rerenderActions();
            });
        }
        self.editElement = function (invokedOn, contextParent, selectedMenu) {
            var elementID = contextParent.attr('id');
            var element = self.element = _.find(self.actionsFromServer, function(e) {
                return e.action == elementID;
            });
            if (element == undefined) {
                self._showPopup({
                    title: gettext("Something went wrong while creating the new Element"),
                    type: "error"
                });
                return;
            }

            var data = ko.mapping.toJS(element);

            self.systemCommandEditorDialogViewModel.reset(data);
            self.systemCommandEditorDialogViewModel.title(gettext("Edit Command"));

            self.systemCommandEditorDialogViewModel.show(function (ret) {
                var element = self.element;

                element.name = ret.name;
                element.action = ret.action;
                element.command = ret.command;

                if (ret.hasOwnProperty("confirm"))
                    element.confirm = ret.confirm;
                else
                    delete element.confirm;

                self.rerenderActions();
            });
        }

        self.systemContextMenu = function (invokedOn, contextParent, selectedMenu)
        {
            switch (selectedMenu.attr('cmd')) {
                case "editCommand": {
                    self.editElement(invokedOn, contextParent, selectedMenu);
                    break;
                }
                case "deleteCommand": {
                    self.deleteElement(invokedOn, contextParent, selectedMenu);
                    break;
                }
                case "createCommand": {
                    self.createElement(invokedOn, contextParent, selectedMenu);
                    break;
                }
            }
        }

        self.onBeforeBinding = function () {
            self.settings = self.settingsViewModel.settings;
        }

        self.onSettingsBeforeSave = function () {
            self.settingsViewModel.system_actions(self.actionsFromServer);
        }

        self.onEventSettingsUpdated = function (payload) {
            self.requestData();
        }
    }

    // view model class, parameters for constructor, container to bind to
    OCTOPRINT_VIEWMODELS.push([
        SystemCommandEditorViewModel,
        ["settingsViewModel", "systemCommandEditorDialogViewModel"],
        ["#settings_plugin_systemcommandeditor"]
    ]);
});