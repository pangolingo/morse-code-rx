
declare var rxjs: any;

type Character = string;

type RXTimestampedValue<T> = {
  value: T;
  timestamp: number;
}

type Suggestion = {
  value: Character;
  marks: Array<RenderableMark>;
}

enum KeyAction {
  Press = 'press',
  Release = 'release'
}

enum Mark {
  Dot = 'dot',
  Dash = 'dash'
}
enum Space {
  Word = 'word_space',
  Letter = 'letter_space',
  Mark = 'mark_space'
}

type MorseChar = Mark | Space;

enum RenderableMorseChar {
  Dot = '∙',
  Dash = '⁃',
  MarkSpace = '',
  LetterSpace = '/',
  WordSpace = '__',
  Unknown = '𖡄',
}

enum RenderableMark {
  Dot = '∙',
  Dash = '⁃',
}

// import { fromEvent } from 'rxjs';
// import { throttleTime, scan } from 'rxjs/operators';
const UNIT = 100; // 1/10 of a second
// word space is 7 units
const WORD_SPACE_DURATION = UNIT * 7;
// letter space is 3 units
const LETTER_SPACE_DURATION = UNIT * 3;
// mark space is 1 unit
// we don't really need this in this program - marks are delimited by keydown/keyup events
const MARK_SPACE_DURATION = UNIT * 1;

class MorseNode {
  value: Character;
  dashLeaf: MorseNode;
  dotLeaf: MorseNode;
  constructor(value: Character, dotLeaf: MorseNode, dashLeaf: MorseNode) {
    this.value = value;
    this.dotLeaf = dotLeaf;
    this.dashLeaf = dashLeaf;
  }
}

// level 4
const h = new MorseNode('H', null, null);
const v = new MorseNode('V', null, null);
const f = new MorseNode('F', null, null);
const l = new MorseNode('L', null, null);
const p = new MorseNode('P', null, null);
const j = new MorseNode('J', null, null);
const b = new MorseNode('B', null, null);
const x = new MorseNode('X', null, null);
const c = new MorseNode('C', null, null);
const y = new MorseNode('Y', null, null);
const z = new MorseNode('Z', null, null);
const q = new MorseNode('Q', null, null);

// level 3
const s = new MorseNode('S', h, v);
const u = new MorseNode('U', f, null);
const r = new MorseNode('R', l, null);
const w = new MorseNode('W', p, j);
const d = new MorseNode('D', b, x);
const k = new MorseNode('K', c, y);
const g = new MorseNode('G', z, q);
const o = new MorseNode('O', null, null);

// level 2
const i = new MorseNode('I', s, u);
const a = new MorseNode('A', r, w);
const n = new MorseNode('N', d, k);
const m = new MorseNode('M', g, o);

// level 1
const e = new MorseNode('E', i, a);
const t = new MorseNode('T', n, m);

// root
const root =  new MorseNode('', e, t);

const getSuggestions = (charParts: Array<Mark>, morseTree: MorseNode) => {
  // traverse tree to end of charparts
  let tree: MorseNode = morseTree;
  for(let i = 0;i < charParts.length; i++){
    if(charParts[i] === Mark.Dot){
      tree = tree.dotLeaf;
    } else if(charParts[i] === Mark.Dash){
      tree = tree.dashLeaf;
    } else {
      throw new Error(`Invalid mark: ${charParts[i]}`)
    }
    if(tree === null){
      // no matching character
      console.warn("no matching character to suggest");
      return [];
    }
  }

  // then traverse and accumulate all possible options
  const possibleTargets: Array<Suggestion> = []; // TODO
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

  const traverse = (tree: MorseNode, possibleTargets: Array<Suggestion>, markStack: Array<RenderableMark>, nodeMarkStr: RenderableMark) => {
    if(tree == null) {
      return;
    }
    // console.log(tree.value, nodeMarkStr);
    markStack.push(nodeMarkStr)
    possibleTargets.push({ value: tree.value, marks: [...markStack]} );

    traverse(tree.dotLeaf, possibleTargets, markStack, RenderableMark.Dot);
    traverse(tree.dashLeaf, possibleTargets, markStack, RenderableMark.Dash);

    markStack.pop();
  }

  const markStack: Array<RenderableMark> = charParts.map((p: Mark): RenderableMark => {
    if(p === Mark.Dot) {
      return RenderableMark.Dot;
    }
    if(p === Mark.Dash) {
      return RenderableMark.Dash;
    }
    throw new Error(`Unknown char part: ${p}`);
  });
  traverse(tree, possibleTargets, markStack, null);
  return possibleTargets
}

const getMostLikelySuggestion = (suggestions: Array<Suggestion>) => {
  return (suggestions.length > 0 ? suggestions[0].value : RenderableMorseChar.Unknown)
}



class MyRenderer {
  signals: Array<MorseChar> = [];
  signalDomEl: HTMLTextAreaElement;
  chars: Array<Character> = [];
  charsDomEl: HTMLTextAreaElement;
  suggestionsDomEl: HTMLTextAreaElement;
  charParts: Array<Mark> = []; // multiple marks that will make up a character

  constructor(){
    this.signalDomEl = document.getElementById('signals') as HTMLTextAreaElement;
    this.charsDomEl = document.getElementById('chars') as HTMLTextAreaElement;
    this.suggestionsDomEl = document.getElementById('suggestions') as HTMLTextAreaElement;
    this.render();
  }

  addSignal(signal: MorseChar) {
    this.signals.push(signal);
    this.render();
  }

  addChar(char: Character) {
    this.chars.push(char);
    this.render();
  }

  honeSuggestions(signal: Mark) {
    this.charParts.push(signal);
    this.render();
  }
  resetSuggestions() {
    this.charParts = [];
  }

  mapSignalsToRenderable(): Array<RenderableMorseChar> {
    return this.signals.map((s: MorseChar): RenderableMorseChar => {
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
          throw new Error(`Unknown signal: ${s}`);
      }
    })
  }

  formatSuggestions(suggestions: Array<Suggestion>): string {
    return suggestions
      // filter out root
      .filter((s: Suggestion) => !!s.value)
      // alphabetize
      .sort((sa: Suggestion, sb: Suggestion) => (sa.value < sb.value ? -1 : 1))
      // format
      .map((s: Suggestion) => { return `${s.value}: ${s.marks.join('')}`}).join('\n');
  }

  render() {
    // TODO: show all when array is empty
    const suggestions = getSuggestions(this.charParts, root);
    const mostLikelySuggestion = getMostLikelySuggestion(suggestions);
    this.signalDomEl.value = this.mapSignalsToRenderable().join('');
    this.charsDomEl.value = this.chars.join('') + `${mostLikelySuggestion}`;
    // this.charsDomEl.value = this.chars.join('') + probableSuggestion;
    // if(!suggestions.map){
    //   console.error(suggestions)
    // }
    // this.suggestionsDomEl.value = suggestions.map(s => { return `${s.value}: ${s.marks.join('')}`}).join('\n');
    this.suggestionsDomEl.value = this.formatSuggestions(suggestions);
  }
}

const renderer = new MyRenderer();

const decode = (markArr: Array<Mark>, morseTree: MorseNode): Character => {
  let tree: MorseNode = morseTree;
  for(let i = 0;i < markArr.length; i++){
    if(markArr[i] === Mark.Dot){
      tree = tree.dotLeaf;
    } else if(markArr[i] === Mark.Dash){
      tree = tree.dashLeaf;
    } else {
      throw new Error(`Invalid mark: ${markArr[i]}`)
    }
    if(tree === null){
      // no matching character
      console.warn("no matching character to decode to");
      return RenderableMorseChar.Unknown;
    }
  }
  return tree.value;
}


const getMarkByTime = (dur: number): Mark => {
  // dash is 3 units
  // dot is 1 unit
  if(dur > UNIT * 2.5) {
    return Mark.Dash;
  }
  return Mark.Dot;
}

const getCharacterFromMarks = (marks: Array<Mark>) => {
  return decode(marks, root);
}

// take keydowns, take keyups
// immediately convert keydowns and keyups to a suggestion
// also but keydowns and keyups into a buffer
// take ticks
// when keyup and no keydown for a bunch of ticks
// clear the buffer, convert to dots/dash, convert to characters, write
// then write a space character

const keyDownStream = rxjs.fromEvent(document, "keydown").pipe(
  // filter to receive only spacebar keydowns
  rxjs.operators.filter((e: KeyboardEvent) => {
    return e.code === "Space";
  }),
  // emit a press action
  rxjs.operators.map((e: boolean) => KeyAction.Press),
  // add a timestamp
  rxjs.operators.timestamp()
);
const keyUpStream = rxjs.fromEvent(document, "keyup").pipe(
  // filter to receive only spacebar keydowns
  rxjs.operators.filter((e: KeyboardEvent) => {
    return e.code === "Space";
  }),
  // emit a release action
  rxjs.operators.map((e: boolean) => KeyAction.Release),
  // add a timestamp
  rxjs.operators.timestamp()
);
// const sharedKeyUpStream = keyUpStream.pipe(rxjs.operators.share());


const letterSpaceStream = keyUpStream.pipe(
  // for each keyup event, start a timer that will emit a space character
  // but cancel the timer if the user starts typing again
  rxjs.operators.switchMap(e => {
    const timeoutStream = rxjs.timer(LETTER_SPACE_DURATION).pipe(
      // emit when time has elapsed after a keyUp - ready for a space character
      // we use 'space' for debugging - doesn't really matter what this emits
      rxjs.operators.mapTo('letter space'),
      // cancel the timer when we get a keydown event - starting the next mark
      rxjs.operators.takeUntil(keyDownStream)
    );
    return timeoutStream;
  })
);
// letterSpaceStream.subscribe(e => console.log('A letter space has been emitted:', e))

const wordSpaceStream = keyUpStream.pipe(
  // for each keyup event, start a timer that will emit a space character
  // but cancel the timer if the user starts typing again
  rxjs.operators.switchMap(e => {
    const timeoutStream = rxjs.timer(WORD_SPACE_DURATION).pipe(
      // emit when time has elapsed after a keyUp - ready for a space character
      // we use 'space' for debugging - doesn't really matter what this emits
      rxjs.operators.mapTo('word space'),
      // cancel the timer when we get a keydown event - starting the next mark
      rxjs.operators.takeUntil(keyDownStream)
    );
    return timeoutStream;
  })
);
// letterSpaceStream.subscribe(e => console.log('A letter space has been emitted:', e))


const inputBuffer = rxjs.merge(keyDownStream, keyUpStream).pipe(
  // debounce multiple keydowns/keyups
  rxjs.operators.distinctUntilChanged(undefined, (e: RXTimestampedValue<KeyAction>): KeyAction => e.value),
  // rxjs.operators.tap(ev => console.log(ev)),
)


const convertInputActionPairsToMorseChars = (evs: Array<RXTimestampedValue<KeyAction>>): MorseChar => {
  // console.log('pairs', evs)
  const delta: number = evs[1].timestamp - evs[0].timestamp;
  // this should only get pairs of events staring with press and ending with release
  // if it doesn't that's a problem
  if(evs[0].value === KeyAction.Release && evs[1].value === KeyAction.Press){
    // we got a pair of events for in between presses
    return null;
  }
  if(evs[0].value !== KeyAction.Press && evs[1].value !== KeyAction.Release){
    throw new Error(`Unknown event pair: ${evs[0].value}, ${evs[1].value}`);
  }
  return getMarkByTime(delta);
}

const dotDashStream = inputBuffer.pipe(
  // buffer until a space - now we are ready to compete the signal
  rxjs.operators.buffer(letterSpaceStream),
  // convert the sets of keyup/keydown into dots and dashes
  rxjs.operators.mergeMap((e: Array<RXTimestampedValue<KeyAction>>) => {
    return rxjs.from(e).pipe(
      rxjs.operators.pairwise(),
      rxjs.operators.map(convertInputActionPairsToMorseChars),
      rxjs.operators.filter((e: MorseChar) => e !== null),
      rxjs.operators.endWith(Space.Mark)
    )
  })
)
  
// display the signals
dotDashStream.subscribe((e: MorseChar) => {
  // console.log(`Adding signal`, e);
  console.log('dashdotstream:', e);
  // renderer.addSignal(e);
});

const sharedDotDashStream = dotDashStream.pipe(rxjs.operators.share());


const suggestionStream = inputBuffer.pipe(
  rxjs.operators.pairwise(),
  rxjs.operators.map(convertInputActionPairsToMorseChars),
  rxjs.operators.filter((e: MorseChar) => e !== null),
  // rxjs.operators.endWith(Space.Mark)
)
suggestionStream.subscribe((e: Mark) => {
  console.log('suggestionstream', e);
  renderer.addSignal(e);
  renderer.honeSuggestions(e);
})


// const flushBufferStream = rxjs.fromEvent(document, "keyup").pipe(
//   // filter to receive only spacebar keydowns
//   rxjs.operators.filter((e: KeyboardEvent) => {
//     return e.code === "KeyG";
//   })
// );

const markSpaceStream = sharedDotDashStream.pipe(
  // rxjs.operators.startWith(Space.Mark),
  // rxjs.operators.tap(e => console.log('looking for spaces', e)),
  // look for spaces
  rxjs.operators.filter((e: MorseChar) => e === Space.Mark),
  // rxjs.operators.tap(e => console.log('got a space, flushing the buffer', e))
)
const letterStream = sharedDotDashStream.pipe(
  // rxjs.operators.tap(e => console.log('buffering this', e)),
  // filter out spaces
  rxjs.operators.filter((e: MorseChar) => e !== Space.Mark),
  // buffer until we get a space character from the spaces stream
  rxjs.operators.buffer(markSpaceStream),
  rxjs.operators.map((e: Array<Mark>): Character => {
    return getCharacterFromMarks(e);
  })
);
letterStream.subscribe((e: Character) => {
  console.log('letterstream', e);
  renderer.resetSuggestions();
  renderer.addChar(e);
  renderer.addSignal(Space.Letter);
});


const wordStream = letterStream.pipe(
  // buffer until a space - now we are ready to compete the word
  // rxjs.operators.tap(e => console.log('buffering this', e)),
  rxjs.operators.buffer(wordSpaceStream),
  rxjs.operators.map((e: Array<Character>): string => {
    return e.join('')// + RenderableMorseChar.WordSpace
  })
);

wordStream.subscribe((e: Character) => {
  console.log('wordstream:', e);
  renderer.resetSuggestions();
  renderer.addChar(' ');
  renderer.addSignal(Space.Word);
  // renderer.addChar(e)
});
