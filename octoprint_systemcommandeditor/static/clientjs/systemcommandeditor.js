(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["OctoPrintClient"], factory);
    } else {
        factory(global.OctoPrintClient);
    }
})(this, function(OctoPrintClient) {
    var OctoPrintSystemCommandEditor = function(base) {
        this.base = base;
        this.url = this.base.getBlueprintUrl("systemcommandeditor");
    };

    OctoPrintSystemCommandEditor.prototype.update = function(updateHistory, opts) {
        var data = {
            updates: updateHistory
        };

        return this.base.postJson(this.url + "updateSystemCommands", data, opts);
    };

    OctoPrintClient.registerPluginComponent("systemcommandeditor", OctoPrintSystemCommandEditor);
    return OctoPrintSystemCommandEditor;
});