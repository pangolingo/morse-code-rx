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
    RenderableMorseChar["LetterSpace"] = "/";
    RenderableMorseChar["WordSpace"] = "__";
    RenderableMorseChar["Unknown"] = "\uD81A\uDC44";
})(RenderableMorseChar || (RenderableMorseChar = {}));
var RenderableMark;
(function (RenderableMark) {
    RenderableMark["Dot"] = "\u2219";
    RenderableMark["Dash"] = "\u2043";
})(RenderableMark || (RenderableMark = {}));
// import { fromEvent } from 'rxjs';
// import { throttleTime, scan } from 'rxjs/operators';
var UNIT = 100; // 1/10 of a second
// word space is 7 units
var WORD_SPACE_DURATION = UNIT * 7;
// letter space is 3 units
var LETTER_SPACE_DURATION = UNIT * 3;
// mark space is 1 unit
// we don't really need this in this program - marks are delimited by keydown/keyup events
var MARK_SPACE_DURATION = UNIT * 1;
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
var getSuggestions = function (charParts, morseTree) {
    // traverse tree to end of charparts
    var tree = morseTree;
    for (var i_1 = 0; i_1 < charParts.length; i_1++) {
        if (charParts[i_1] === Mark.Dot) {
            tree = tree.dotLeaf;
        }
        else if (charParts[i_1] === Mark.Dash) {
            tree = tree.dashLeaf;
        }
        else {
            throw new Error("Invalid mark: " + charParts[i_1]);
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
        traverse(tree.dotLeaf, possibleTargets, markStack, RenderableMark.Dot);
        traverse(tree.dashLeaf, possibleTargets, markStack, RenderableMark.Dash);
        markStack.pop();
    };
    var markStack = charParts.map(function (p) {
        if (p === Mark.Dot) {
            return RenderableMark.Dot;
        }
        if (p === Mark.Dash) {
            return RenderableMark.Dash;
        }
        throw new Error("Unknown char part: " + p);
    });
    traverse(tree, possibleTargets, markStack, null);
    return possibleTargets;
};
var getMostLikelySuggestion = function (suggestions) {
    return (suggestions.length > 0 ? suggestions[0].value : RenderableMorseChar.Unknown);
};
var MyRenderer = /** @class */ (function () {
    function MyRenderer() {
        this.signals = [];
        this.chars = [];
        this.charParts = []; // multiple marks that will make up a character
        this.signalDomEl = document.getElementById('signals');
        this.charsDomEl = document.getElementById('chars');
        this.suggestionsDomEl = document.getElementById('suggestions');
        this.render();
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
                    return RenderableMorseChar.LetterSpace;
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
    MyRenderer.prototype.formatSuggestions = function (suggestions) {
        return suggestions
            // filter out root
            .filter(function (s) { return !!s.value; })
            // alphabetize
            .sort(function (sa, sb) { return (sa.value < sb.value ? -1 : 1); })
            // format
            .map(function (s) { return s.value + ": " + s.marks.join(''); }).join('\n');
    };
    MyRenderer.prototype.render = function () {
        // TODO: show all when array is empty
        var suggestions = getSuggestions(this.charParts, root);
        var mostLikelySuggestion = getMostLikelySuggestion(suggestions);
        this.signalDomEl.value = this.mapSignalsToRenderable().join('');
        this.charsDomEl.value = this.chars.join('') + ("" + mostLikelySuggestion);
        // this.charsDomEl.value = this.chars.join('') + probableSuggestion;
        // if(!suggestions.map){
        //   console.error(suggestions)
        // }
        // this.suggestionsDomEl.value = suggestions.map(s => { return `${s.value}: ${s.marks.join('')}`}).join('\n');
        this.suggestionsDomEl.value = this.formatSuggestions(suggestions);
    };
    return MyRenderer;
}());
var renderer = new MyRenderer();
var decode = function (markArr, morseTree) {
    var tree = morseTree;
    for (var i_2 = 0; i_2 < markArr.length; i_2++) {
        if (markArr[i_2] === Mark.Dot) {
            tree = tree.dotLeaf;
        }
        else if (markArr[i_2] === Mark.Dash) {
            tree = tree.dashLeaf;
        }
        else {
            throw new Error("Invalid mark: " + markArr[i_2]);
        }
        if (tree === null) {
            // no matching character
            console.warn("no matching character to decode to");
            return RenderableMorseChar.Unknown;
        }
    }
    return tree.value;
};
var getMarkByTime = function (dur) {
    // dash is 3 units
    // dot is 1 unit
    if (dur > UNIT * 2.5) {
        return Mark.Dash;
    }
    return Mark.Dot;
};
var getCharacterFromMarks = function (marks) {
    return decode(marks, root);
};
// take keydowns, take keyups
// immediately convert keydowns and keyups to a suggestion
// also but keydowns and keyups into a buffer
// take ticks
// when keyup and no keydown for a bunch of ticks
// clear the buffer, convert to dots/dash, convert to characters, write
// then write a space character
var keyDownStream = rxjs.fromEvent(document, "keydown").pipe(
// filter to receive only spacebar keydowns
rxjs.operators.filter(function (e) {
    return e.code === "Space";
}), 
// emit a press action
rxjs.operators.map(function (e) { return KeyAction.Press; }), 
// add a timestamp
rxjs.operators.timestamp());
var keyUpStream = rxjs.fromEvent(document, "keyup").pipe(
// filter to receive only spacebar keydowns
rxjs.operators.filter(function (e) {
    return e.code === "Space";
}), 
// emit a release action
rxjs.operators.map(function (e) { return KeyAction.Release; }), 
// add a timestamp
rxjs.operators.timestamp());
// const sharedKeyUpStream = keyUpStream.pipe(rxjs.operators.share());
var letterSpaceStream = keyUpStream.pipe(
// for each keyup event, start a timer that will emit a space character
// but cancel the timer if the user starts typing again
rxjs.operators.switchMap(function (e) {
    var timeoutStream = rxjs.timer(LETTER_SPACE_DURATION).pipe(
    // emit when time has elapsed after a keyUp - ready for a space character
    // we use 'space' for debugging - doesn't really matter what this emits
    rxjs.operators.mapTo('letter space'), 
    // cancel the timer when we get a keydown event - starting the next mark
    rxjs.operators.takeUntil(keyDownStream));
    return timeoutStream;
}));
// letterSpaceStream.subscribe(e => console.log('A letter space has been emitted:', e))
var wordSpaceStream = keyUpStream.pipe(
// for each keyup event, start a timer that will emit a space character
// but cancel the timer if the user starts typing again
rxjs.operators.switchMap(function (e) {
    var timeoutStream = rxjs.timer(WORD_SPACE_DURATION).pipe(
    // emit when time has elapsed after a keyUp - ready for a space character
    // we use 'space' for debugging - doesn't really matter what this emits
    rxjs.operators.mapTo('word space'), 
    // cancel the timer when we get a keydown event - starting the next mark
    rxjs.operators.takeUntil(keyDownStream));
    return timeoutStream;
}));
// letterSpaceStream.subscribe(e => console.log('A letter space has been emitted:', e))
var inputBuffer = rxjs.merge(keyDownStream, keyUpStream).pipe(
// debounce multiple keydowns/keyups
rxjs.operators.distinctUntilChanged(undefined, function (e) { return e.value; }));
var convertInputActionPairsToMorseChars = function (evs) {
    // console.log('pairs', evs)
    var delta = evs[1].timestamp - evs[0].timestamp;
    // this should only get pairs of events staring with press and ending with release
    // if it doesn't that's a problem
    if (evs[0].value === KeyAction.Release && evs[1].value === KeyAction.Press) {
        // we got a pair of events for in between presses
        return null;
    }
    if (evs[0].value !== KeyAction.Press && evs[1].value !== KeyAction.Release) {
        throw new Error("Unknown event pair: " + evs[0].value + ", " + evs[1].value);
    }
    return getMarkByTime(delta);
};
var dotDashStream = inputBuffer.pipe(
// buffer until a space - now we are ready to compete the signal
rxjs.operators.buffer(letterSpaceStream), 
// convert the sets of keyup/keydown into dots and dashes
rxjs.operators.mergeMap(function (e) {
    return rxjs.from(e).pipe(rxjs.operators.pairwise(), rxjs.operators.map(convertInputActionPairsToMorseChars), rxjs.operators.filter(function (e) { return e !== null; }), rxjs.operators.endWith(Space.Mark));
}));
// display the signals
dotDashStream.subscribe(function (e) {
    // console.log(`Adding signal`, e);
    console.log('dashdotstream:', e);
    // renderer.addSignal(e);
});
var sharedDotDashStream = dotDashStream.pipe(rxjs.operators.share());
var suggestionStream = inputBuffer.pipe(rxjs.operators.pairwise(), rxjs.operators.map(convertInputActionPairsToMorseChars), rxjs.operators.filter(function (e) { return e !== null; }));
suggestionStream.subscribe(function (e) {
    console.log('suggestionstream', e);
    renderer.addSignal(e);
    renderer.honeSuggestions(e);
});
// const flushBufferStream = rxjs.fromEvent(document, "keyup").pipe(
//   // filter to receive only spacebar keydowns
//   rxjs.operators.filter((e: KeyboardEvent) => {
//     return e.code === "KeyG";
//   })
// );
var markSpaceStream = sharedDotDashStream.pipe(
// rxjs.operators.startWith(Space.Mark),
// rxjs.operators.tap(e => console.log('looking for spaces', e)),
// look for spaces
rxjs.operators.filter(function (e) { return e === Space.Mark; }));
var letterStream = sharedDotDashStream.pipe(
// rxjs.operators.tap(e => console.log('buffering this', e)),
// filter out spaces
rxjs.operators.filter(function (e) { return e !== Space.Mark; }), 
// buffer until we get a space character from the spaces stream
rxjs.operators.buffer(markSpaceStream), rxjs.operators.map(function (e) {
    return getCharacterFromMarks(e);
}));
letterStream.subscribe(function (e) {
    console.log('letterstream', e);
    renderer.resetSuggestions();
    renderer.addChar(e);
    renderer.addSignal(Space.Letter);
});
var wordStream = letterStream.pipe(
// buffer until a space - now we are ready to compete the word
// rxjs.operators.tap(e => console.log('buffering this', e)),
rxjs.operators.buffer(wordSpaceStream), rxjs.operators.map(function (e) {
    return e.join(''); // + RenderableMorseChar.WordSpace
}));
wordStream.subscribe(function (e) {
    console.log('wordstream:', e);
    renderer.resetSuggestions();
    renderer.addChar(' ');
    renderer.addSignal(Space.Word);
    // renderer.addChar(e)
});
