function Keyboard() {

    var pressedKeys = {};
    this.actions = {};
    function handleKeyDown(event) {
        pressedKeys[event.keyCode] = true;
    }
    function handleKeyUp(event) {
        pressedKeys[event.keyCode] = false;
    }
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    this.pressedKeys = pressedKeys;
}

Keyboard.Keys = {
    LeftArrow: 37,
    UpArrow: 38,
    RightArrow: 39,
    DownArrow: 40,
    PageUp: 33,
    PageDown: 34,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90
};

Keyboard.prototype = {
    bind: function(keyCode, handler, action) {
        this.actions[keyCode] = {
            handler: handler,
            action: action
        };
    },
    handle: function() {
        for(var key in this.actions) {
            if (this.actions.hasOwnProperty(key) && this.pressedKeys[key]) {
                this.actions[key].action.call(this.actions[key].handler);
            }
        }
    }
};

module.exports = Keyboard;