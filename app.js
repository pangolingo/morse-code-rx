var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var KeyAction;
(function (KeyAction) {
    KeyAction["Press"] = "press";
    KeyAction["Release"] = "release";
})(KeyAction || (KeyAction = {}));
var Mark;
(function (Mark) {
    Mark["Dot"] = "dot";
    Mark["Dash"] = "dash";
})(Mark || (Mark = {}));
var Space;
(function (Space) {
    Space["Word"] = "word_space";
    Space["Letter"] = "letter_space";
    Space["Mark"] = "mark_space";
})(Space || (Space = {}));
var RenderableMorseChar;
(function (RenderableMorseChar) {
    RenderableMorseChar["Dot"] = "\u2219";
    RenderableMorseChar["Dash"] = "\u2043";
    RenderableMorseChar["MarkSpace"] = "";
    RenderableMorseChar["WordSpace"] = " ";
    RenderableMorseChar["Unknown"] = "\uD81A\uDC44";
})(RenderableMorseChar || (RenderableMorseChar = {}));
// import { fromEvent } from 'rxjs';
// import { throttleTime, scan } from 'rxjs/operators';
var UNIT = 100; // 1/10 of a second
var MyRenderer = /** @class */ (function () {
    function MyRenderer() {
        this.signals = [];
        this.chars = [];
        this.charParts = [];
        this.signalDomEl = document.getElementById('signals');
        this.charsDomEl = document.getElementById('chars');
        this.suggestionsDomEl = document.getElementById('suggestions');
    }
    MyRenderer.prototype.addSignal = function (signal) {
        this.signals.push(signal);
        this.render();
    };
    MyRenderer.prototype.addChar = function (char) {
        this.chars.push(char);
        this.render();
    };
    MyRenderer.prototype.honeSuggestions = function (signal) {
        this.charParts.push(signal);
        this.render();
    };
    MyRenderer.prototype.resetSuggestions = function () {
        this.charParts = [];
    };
    MyRenderer.prototype.mapSignalsToRenderable = function () {
        return this.signals.map(function (s) {
            switch (s) {
                case Space.Letter:
                case Space.Mark:
                    return RenderableMorseChar.MarkSpace;
                case Space.Word:
                    return RenderableMorseChar.WordSpace;
                case Mark.Dot:
                    return RenderableMorseChar.Dot;
                case Mark.Dash:
                    return RenderableMorseChar.Dash;
                default:
                    throw new Error("Unknown signal: " + s);
            }
        });
    };
    MyRenderer.prototype.render = function () {
        // TODO: show all when array is empty
        var suggestions = getSuggestions(this.charParts, root);
        this.signalDomEl.value = this.mapSignalsToRenderable().join('');
        var probableSuggestion = (suggestions.length > 0 ? suggestions[0].value : RenderableMorseChar.Unknown);
        this.charsDomEl.value = this.chars.join('') + probableSuggestion;
        if (!suggestions.map) {
            console.error(suggestions);
        }
        this.suggestionsDomEl.value = suggestions.map(function (s) { return s.value + ": " + s.marks.join(''); }).join('\n');
    };
    return MyRenderer;
}());
var renderer = new MyRenderer();
var getSpaceByTime = function (dur) {
    // word space is 7 units
    // letter space is 3 units
    // mark space is 1 unit
    if (dur > UNIT * 6.5) {
        return Space.Word;
    }
    if (dur > UNIT * 2.5) {
        return Space.Letter;
    }
    return Space.Mark;
};
var getMarkByTime = function (dur) {
    // dash is 3 units
    // dot is 1 unit
    if (dur > UNIT * 2.5) {
        return Mark.Dash;
    }
    return Mark.Dot;
};
var MorseNode = /** @class */ (function () {
    function MorseNode(value, dotLeaf, dashLeaf) {
        this.value = value;
        this.dotLeaf = dotLeaf;
        this.dashLeaf = dashLeaf;
    }
    return MorseNode;
}());
// level 4
var h = new MorseNode('H', null, null);
var v = new MorseNode('V', null, null);
var f = new MorseNode('F', null, null);
var l = new MorseNode('L', null, null);
var p = new MorseNode('P', null, null);
var j = new MorseNode('J', null, null);
var b = new MorseNode('B', null, null);
var x = new MorseNode('X', null, null);
var c = new MorseNode('C', null, null);
var y = new MorseNode('Y', null, null);
var z = new MorseNode('Z', null, null);
var q = new MorseNode('Q', null, null);
// level 3
var s = new MorseNode('S', h, v);
var u = new MorseNode('U', f, null);
var r = new MorseNode('R', l, null);
var w = new MorseNode('W', p, j);
var d = new MorseNode('D', b, x);
var k = new MorseNode('K', c, y);
var g = new MorseNode('G', z, q);
var o = new MorseNode('O', null, null);
// level 2
var i = new MorseNode('I', s, u);
var a = new MorseNode('A', r, w);
var n = new MorseNode('N', d, k);
var m = new MorseNode('M', g, o);
// level 1
var e = new MorseNode('E', i, a);
var t = new MorseNode('T', n, m);
// root
var root = new MorseNode('', e, t);
var decode = function (markArr, morseTree) {
    var tree = morseTree;
    for (var i_1 = 0; i_1 < markArr.length; i_1++) {
        if (markArr[i_1] === Mark.Dot) {
            tree = tree.dotLeaf;
        }
        else if (markArr[i_1] === Mark.Dash) {
            tree = tree.dashLeaf;
        }
        else {
            throw new Error("Invalid mark: " + markArr[i_1]);
        }
        if (tree === null) {
            // no matching character
            console.warn("no matching character to decode to");
            return RenderableMorseChar.Unknown;
        }
    }
    return tree.value;
};
var getSuggestions = function (charParts, morseTree) {
    // traverse tree to end of charparts
    var tree = morseTree;
    for (var i_2 = 0; i_2 < charParts.length; i_2++) {
        if (charParts[i_2] === Mark.Dot) {
            tree = tree.dotLeaf;
        }
        else if (charParts[i_2] === Mark.Dash) {
            tree = tree.dashLeaf;
        }
        else {
            throw new Error("Invalid mark: " + charParts[i_2]);
        }
        if (tree === null) {
            // no matching character
            console.warn("no matching character to suggest");
            return [];
        }
    }
    // then traverse and accumulate all possible options
    var possibleTargets = []; // TODO
    // const traverse = (tree, currentPath, possiblePaths) => {
    //   if(tree == null) {
    //     return;
    //   }
    //   currentPath.push(tree.value);
    //   if(tree.dotLeaf == null && tree.dashLeaf == null) {
    //     possiblePaths.push(currentPath.join(''));
    //     // console.log(currentPath.join(''));
    //     // currentPath.push('end')
    //   }
    //   traverse(tree.dotLeaf, currentPath, possiblePaths);
    //   traverse(tree.dashLeaf, currentPath, possiblePaths);
    //   currentPath.pop();
    // }
    var traverse = function (tree, possibleTargets, markStack, nodeMarkStr) {
        if (tree == null) {
            return;
        }
        // console.log(tree.value, nodeMarkStr);
        markStack.push(nodeMarkStr);
        possibleTargets.push({ value: tree.value, marks: __spreadArrays(markStack) });
        traverse(tree.dotLeaf, possibleTargets, markStack, RenderableMorseChar.Dot);
        traverse(tree.dashLeaf, possibleTargets, markStack, RenderableMorseChar.Dash);
        markStack.pop();
    };
    var markStack = charParts.map(function (p) {
        if (p === Mark.Dot) {
            return RenderableMorseChar.Dot;
        }
        if (p === Mark.Dash) {
            return RenderableMorseChar.Dash;
        }
        throw new Error("Unknown char part: " + p);
    });
    traverse(tree, possibleTargets, markStack, RenderableMorseChar.MarkSpace);
    return possibleTargets;
};
var getCharacterFromMarks = function (marks) {
};
var stream1 = rxjs
    .merge(rxjs.fromEvent(document, "keydown").pipe(
// filter to receive only spacebar keydowns
rxjs.operators.filter(function (e) {
    return e.code === "Space";
}), 
// emit a press action
rxjs.operators.map(function (e) { return KeyAction.Press; }), 
// add a timestamp
rxjs.operators.timestamp()), rxjs.fromEvent(document, "keyup").pipe(
// filter to receive only spacebar keyups
rxjs.operators.filter(function (e) {
    return e.code === "Space";
}), 
// emit a press release
rxjs.operators.map(function (e) { return KeyAction.Release; }), 
// add a timestamp
rxjs.operators.timestamp()))
    .pipe(rxjs.operators.distinctUntilChanged(undefined, function (e) { return e.value; }), 
//rxjs.operators.bufferCount(2), // consider groupBy instead
rxjs.operators.pairwise(), rxjs.operators.map(function (evs) {
    var delta = evs[1].timestamp - evs[0].timestamp;
    if (evs[0].value === KeyAction.Release && evs[1].value === KeyAction.Press) {
        return getSpaceByTime(delta);
    }
    if (evs[0].value === KeyAction.Press && evs[1].value === KeyAction.Release) {
        return getMarkByTime(delta);
    }
    throw new Error("Unknown event pair: " + evs[0].value + ", " + evs[1].value);
}));
var stream2 = stream1.pipe(
// buffer until we get a space character
rxjs.operators.bufferWhen(function () {
    return stream1.pipe(rxjs.operators.filter(function (e) { return e === Space.Word || e === Space.Letter; }));
}), 
// filter out the space characters
rxjs.operators.map(function (eArr) {
    return eArr.filter(function (eA) {
        return eA === Mark.Dot || eA === Mark.Dash;
    });
}));
// print characters
stream2.subscribe(function (e) {
    var decoded = decode(e, root);
    // console.log(decoded)
    renderer.addChar(decoded);
});
// space characters
// print characters
stream1.pipe(rxjs.operators.filter(function (e) { return e === Space.Word; })).subscribe(function (e) {
    // TODO: this screws up
    // renderer.addChar('_')
});
// print signals
stream1.subscribe(function (e) {
    console.log("Adding signal", e);
    renderer.addSignal(e);
});
// print suggestions
stream1.pipe(rxjs.operators.filter(function (e) { return e === Mark.Dot || e === Mark.Dash; })).subscribe(function (e) {
    // console.log(`Event ${JSON.stringify(e)}`);
    renderer.honeSuggestions(e);
});
stream1.pipe(rxjs.operators.filter(function (e) { return e === Space.Word || e === Space.Letter; })).subscribe(function (e) {
    // console.log(`Event ${JSON.stringify(e)}`);
    renderer.resetSuggestions();
});
