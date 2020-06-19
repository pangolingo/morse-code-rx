var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
// import { fromEvent } from 'rxjs';
// import { throttleTime, scan } from 'rxjs/operators';
var UNIT = 100; // 1/10 of a second
var DOT_CHAR = '∙';
var DASH_CHAR = '⁃';
var UNKNOWN_CHAR = '𖡄';
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
                case 'letter_space':
                case 'mark_space':
                    return '';
                case 'word_space':
                    return ' ';
                case 'dot':
                    return DOT_CHAR;
                case 'dash':
                    return DASH_CHAR;
                default:
                    throw new Error("Unknown signal: " + s);
            }
        });
    };
    MyRenderer.prototype.render = function () {
        if (this.charParts.length < 1) {
            return;
        }
        else {
        }
        var suggestions = getSuggestions(this.charParts, root);
        this.signalDomEl.value = this.mapSignalsToRenderable().join('');
        var probableSuggestion = (suggestions.length > 0 ? suggestions[0].value : UNKNOWN_CHAR);
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
        return 'word_space';
    }
    if (dur > UNIT * 2.5) {
        return 'letter_space';
    }
    return 'mark_space';
};
var getMarkByTime = function (dur) {
    // dash is 3 units
    // dot is 1 unit
    if (dur > UNIT * 2.5) {
        return 'dash';
    }
    return 'dot';
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
        if (markArr[i_1] === 'dot') {
            tree = tree.dotLeaf;
        }
        else if (markArr[i_1] === 'dash') {
            tree = tree.dashLeaf;
        }
        else {
            throw new Error("Invalid mark: " + markArr[i_1]);
        }
        if (tree === null) {
            // no matching character
            console.warn("no matching character");
            return UNKNOWN_CHAR;
        }
    }
    return tree.value;
};
var getSuggestions = function (charParts, morseTree) {
    // traverse tree to end of charparts
    var tree = morseTree;
    for (var i_2 = 0; i_2 < charParts.length; i_2++) {
        if (charParts[i_2] === 'dot') {
            tree = tree.dotLeaf;
        }
        else if (charParts[i_2] === 'dash') {
            tree = tree.dashLeaf;
        }
        else {
            throw new Error("Invalid mark: " + charParts[i_2]);
        }
        if (tree === null) {
            // no matching character
            console.warn("no matching character");
            return [];
        }
    }
    // then traverse and accumulate all possible options
    var possibleTargets = [];
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
        console.log(tree.value, nodeMarkStr);
        markStack.push(nodeMarkStr);
        possibleTargets.push({ value: tree.value, marks: __spreadArrays(markStack) });
        traverse(tree.dotLeaf, possibleTargets, markStack, DOT_CHAR);
        traverse(tree.dashLeaf, possibleTargets, markStack, DASH_CHAR);
        markStack.pop();
    };
    var markStack = charParts.map(function (p) {
        if (p === 'dot') {
            return DOT_CHAR;
        }
        if (p === 'dash') {
            return DASH_CHAR;
        }
        throw new Error("Unknown char part: " + p);
    });
    traverse(tree, possibleTargets, markStack, "");
    return possibleTargets;
};
var getCharacterFromMarks = function (marks) {
};
var stream1 = rxjs
    .merge(rxjs.fromEvent(document, "keydown").pipe(
// rxjs.operators.scan(count => count + 1, 0)
rxjs.operators.filter(function (e) {
    return e.code === "Space";
}), 
// rxjs.operators.map(e => ["press", new Date()])
rxjs.operators.map(function (e) { return "press"; }), rxjs.operators.timestamp()), rxjs.fromEvent(document, "keyup").pipe(
// rxjs.operators.scan(count => count + 1, 0)
rxjs.operators.filter(function (e) {
    return e.code === "Space";
}), 
// rxjs.operators.map(e => ["release", new Date()])
rxjs.operators.map(function (e) { return "release"; }), rxjs.operators.timestamp()))
    .pipe(rxjs.operators.distinctUntilChanged(undefined, function (e) { return e.value; }), 
//rxjs.operators.bufferCount(2), // consider groupBy instead
rxjs.operators.pairwise(), rxjs.operators.map(function (evs) {
    // const delta = evs[2][1] - evs[1][1];
    // return delta;
    var delta = evs[1].timestamp - evs[0].timestamp;
    if (evs[0].value === 'release' && evs[1].value === 'press') {
        return getSpaceByTime(delta);
    }
    if (evs[0].value === 'press' && evs[1].value === 'release') {
        return getMarkByTime(delta);
    }
    throw new Error("Unknown event pair: " + evs[0].value + ", " + evs[1].value);
}));
var stream2 = stream1.pipe(
//rxjs.operators.tap(e => console.log('tapped'))
rxjs.operators.bufferWhen(function () {
    return stream1.pipe(rxjs.operators.filter(function (e) { return e === 'word_space' || e === 'letter_space'; }));
}), rxjs.operators.map(function (eArr) {
    return eArr.filter(function (eA) {
        return eA === 'dot' || eA === 'dash';
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
stream1.pipe(rxjs.operators.filter(function (e) { return e === 'word_space'; })).subscribe(function (e) {
    // TODO: this screws up
    // renderer.addChar(" ")
});
// print signals
stream1.subscribe(function (e) {
    // console.log(`Event ${JSON.stringify(e)}`);
    renderer.addSignal(e);
});
// print suggestions
stream1.pipe(rxjs.operators.filter(function (e) { return e === 'dot' || e === 'dash'; })).subscribe(function (e) {
    // console.log(`Event ${JSON.stringify(e)}`);
    renderer.honeSuggestions(e);
});
stream1.pipe(rxjs.operators.filter(function (e) { return e === 'word_space' || e === 'letter_space'; })).subscribe(function (e) {
    // console.log(`Event ${JSON.stringify(e)}`);
    renderer.resetSuggestions(e);
});
