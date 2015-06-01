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
        }
        self.show = function (f) {
            var dialog = $("#systemCommandEditorDialog");
            var primarybtn = $('div.modal-footer .btn-primary', dialog);

            primarybtn.unbind('click').bind('click', function (e) {
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
        }
    }

    // view model class, parameters for constructor, container to bind to
    OCTOPRINT_VIEWMODELS.push([
        systemCommandEditorDialogViewModel,
        [],
        "#systemCommandEditorDialog"
    ]);
});