$(function () {
    function systemCommandEditorDialogViewModel(parameters) {
        var self = this;

        self.element = ko.observable();

        self.title = ko.observable(gettext("Create Command"));

        self.useConfirm = ko.observable(false);

        self.reset = function (data) {
            var element = {
                name: "",
                action: "",
                command: "",
                confirm: ""
            };

            if (typeof data == "object") {
                element = _.extend(element, data);

                self.useConfirm(data.hasOwnProperty("confirm"));
            }

            self.element(ko.mapping.fromJS(element));
        };

        self.show = function (f) {
            var dialog = $("#systemCommandEditorDialog");
            var from = $('#systemCommandEditorDialogForm', dialog);

            from.on('submit', function (e) {
                var name = $('#systemCommandEditorDialog_Name');
                var action = $('#systemCommandEditorDialog_Action');

                var error = false;

                if (!name.val()) {
                    name.closest('.control-group').removeClass('success').addClass('error');

                    error = true;
                }
                if (!action.val()) {
                    action.closest('.control-group').removeClass('success').addClass('error');

                    error = true;
                }

                if (error) {
                    e.preventDefault();
                    return;
                }

                dialog.modal('hide');
                var obj = ko.mapping.toJS(self.element);

                if (!self.useConfirm())
                    delete obj.confirm;

                f(obj);
            });

            dialog.modal({
                show: 'true',
                backdrop: 'static',
                keyboard: false
            });
        };
    }

    // view model class, parameters for constructor, container to bind to
    OCTOPRINT_VIEWMODELS.push([
        systemCommandEditorDialogViewModel,
        [],
        "#systemCommandEditorDialog"
    ]);
});