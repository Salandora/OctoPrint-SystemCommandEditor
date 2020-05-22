// Based on https://stackoverflow.com/questions/17165096/custom-events-in-class
class ClassEvents {
    constructor() {
        this.listeners = new Map();
    }

    // execute the callback everytime the label is trigger
    on(label, callback) {
        this.listeners.has(label) || this.listeners.set(label, []);
        this.listeners.get(label).push(callback);

        return this;
    }

    // remove the callback for a label
    off(label, callback = true) {
        if (callback === true) {
            // remove listeners for all callbackfunctions
            this.listeners.delete(label);
        } else {
            // remove listeners only with match callbackfunctions
            let listeners = this.listeners.get(label);
            if (listeners) {
                this.listeners.set(label, listeners.filter((value) => !(value === callback)));
            }
        }

        return this;
    }

    // trigger the event with the label
    trigger(label, ...args) {
        let listeners = this.listeners.get(label);
        if (listeners && listeners.length) {
            listeners.forEach((listener) => {
                listener(...args);
            });
        }

        return this;
    }
}

class HistoryNode {
    constructor(action, data) {
        this.action = action;
        this.data = data;
    }
}

class UndoRedoHistory extends ClassEvents {
    constructor() {
        super();
        this.historyIndex = 0;
        this.history = [];
    }

    push(node) {
        this.history = this.history.slice(0, this.historyIndex + 1);

        this.history.push(node);
        this.historyIndex++;

        this.trigger("add", node);
    }

    clear() {
        this.historyIndex = 0;
        this.history = [];

        this.trigger("clear");
    }

    hasUndo() {
        return this.historyIndex !== 0;
    }

    undo() {
        if (!this.hasUndo()) {
            return;
        }

        --this.historyIndex;
        this.trigger("undo");
    }

    hasRedo() {
        return this.historyIndex !== this.history.length;
    }

    redo() {
        if (!this.hasRedo()) {
            return;
        }

        ++this.historyIndex;
        this.trigger("redo");
    }

    values() {
        return this.history.slice(0, this.historyIndex);
    }

    [Symbol.iterator]() {
        return this.values();
    }
}