
declare var rxjs: any;

type Character = string;

type RXTimestampedValue<T> = {
  value: T;
  timestamp: number;
}

type Suggestion = {
  value: Character;
  marks: Array<RenderableMorseChar>;
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
  WordSpace = ' ',
  Unknown = '𖡄',
}

// import { fromEvent } from 'rxjs';
// import { throttleTime, scan } from 'rxjs/operators';
const UNIT = 100; // 1/10 of a second

class MyRenderer {
  signals: Array<MorseChar> = [];
  signalDomEl: HTMLTextAreaElement;
  chars: Array<Character> = [];
  charsDomEl: HTMLTextAreaElement;
  suggestionsDomEl: HTMLTextAreaElement;
  charParts: Array<Mark> = [];

  constructor(){
    this.signalDomEl = document.getElementById('signals') as HTMLTextAreaElement;
    this.charsDomEl = document.getElementById('chars') as HTMLTextAreaElement;
    this.suggestionsDomEl = document.getElementById('suggestions') as HTMLTextAreaElement;
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

  render() {
    // TODO: show all when array is empty
    const suggestions = getSuggestions(this.charParts, root);
    this.signalDomEl.value = this.mapSignalsToRenderable().join('');
    const probableSuggestion = (suggestions.length > 0 ? suggestions[0].value : RenderableMorseChar.Unknown);
    this.charsDomEl.value = this.chars.join('') + probableSuggestion;
    if(!suggestions.map){
      console.error(suggestions)
    }
    this.suggestionsDomEl.value = suggestions.map(s => { return `${s.value}: ${s.marks.join('')}`}).join('\n');
  }
}

const renderer = new MyRenderer();

const getSpaceByTime = (dur: number): Space => {
  // word space is 7 units
  // letter space is 3 units
  // mark space is 1 unit
  if(dur > UNIT * 6.5) {
    return Space.Word;
  }
  if(dur > UNIT * 2.5) {
    return Space.Letter;
  }
  return Space.Mark;
}
const getMarkByTime = (dur: number): Mark => {
  // dash is 3 units
  // dot is 1 unit
  if(dur > UNIT * 2.5) {
    return Mark.Dash;
  }
  return Mark.Dot;
}

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

  const traverse = (tree: MorseNode, possibleTargets: Array<Suggestion>, markStack: Array<RenderableMorseChar>, nodeMarkStr: RenderableMorseChar) => {
    if(tree == null) {
      return;
    }
    // console.log(tree.value, nodeMarkStr);
    markStack.push(nodeMarkStr)
    possibleTargets.push({ value: tree.value, marks: [...markStack]} );

    traverse(tree.dotLeaf, possibleTargets, markStack, RenderableMorseChar.Dot);
    traverse(tree.dashLeaf, possibleTargets, markStack, RenderableMorseChar.Dash);

    markStack.pop();
  }

  const markStack: Array<RenderableMorseChar> = charParts.map((p: Mark): RenderableMorseChar => {
    if(p === Mark.Dot) {
      return RenderableMorseChar.Dot;
    }
    if(p === Mark.Dash) {
      return RenderableMorseChar.Dash;
    }
    throw new Error(`Unknown char part: ${p}`);
  });
  traverse(tree, possibleTargets, markStack, RenderableMorseChar.MarkSpace);
  return possibleTargets
}

const getCharacterFromMarks = (marks) => {
  
}

const stream1 = rxjs
  .merge(
    rxjs.fromEvent(document, "keydown").pipe(
      // filter to receive only spacebar keydowns
      rxjs.operators.filter((e: KeyboardEvent) => {
        return e.code === "Space";
      }),
      // emit a press action
      rxjs.operators.map((e: boolean) => KeyAction.Press),
      // add a timestamp
      rxjs.operators.timestamp()
    ),
    rxjs.fromEvent(document, "keyup").pipe(
      // filter to receive only spacebar keyups
      rxjs.operators.filter((e: KeyboardEvent) => {
        return e.code === "Space";
      }),
      // emit a press release
      rxjs.operators.map((e: boolean) => KeyAction.Release),
      // add a timestamp
      rxjs.operators.timestamp()
    )
  )
  .pipe(
    rxjs.operators.distinctUntilChanged(undefined, (e: RXTimestampedValue<KeyAction>): KeyAction => e.value),
    //rxjs.operators.bufferCount(2), // consider groupBy instead
    rxjs.operators.pairwise(),
    rxjs.operators.map((evs: Array<RXTimestampedValue<KeyAction>>): MorseChar => {
      const delta: number = evs[1].timestamp - evs[0].timestamp;
      if(evs[0].value === KeyAction.Release && evs[1].value === KeyAction.Press){
         return getSpaceByTime(delta);
      }
      if(evs[0].value === KeyAction.Press && evs[1].value === KeyAction.Release){
         return getMarkByTime(delta);
      }
      throw new Error(`Unknown event pair: ${evs[0].value}, ${evs[1].value}`);
    })
  )

const stream2 = stream1.pipe(
    // buffer until we get a space character
    rxjs.operators.bufferWhen(() => {
      return stream1.pipe(
        rxjs.operators.filter((e: MorseChar) => { return e === Space.Word || e === Space.Letter })
      )
    }),
    // filter out the space characters
    rxjs.operators.map((eArr: Array<MorseChar>): Array<MorseChar> => {
      return eArr.filter((eA: MorseChar): boolean => {
        return eA === Mark.Dot || eA === Mark.Dash
      });
    })
  );

// print characters
stream2.subscribe((e: Array<Mark>) => {
  const decoded: Character = decode(e, root)
  // console.log(decoded)
  renderer.addChar(decoded)
})
// space characters
// print characters
stream1.pipe(
  rxjs.operators.filter((e: MorseChar): boolean => { return e === Space.Word})
).subscribe((e: Space.Word) => {
  // TODO: this screws up
  // renderer.addChar('_')
})

// print signals
stream1.subscribe((e: MorseChar) => {
  console.log(`Adding signal`, e);
  renderer.addSignal(e);
});

// print suggestions
stream1.pipe(
  rxjs.operators.filter((e: MorseChar) => { return e === Mark.Dot || e === Mark.Dash })
).subscribe((e: Mark) => {
  // console.log(`Event ${JSON.stringify(e)}`);
  renderer.honeSuggestions(e);
});
stream1.pipe(
  rxjs.operators.filter((e: MorseChar) => { return e === Space.Word || e === Space.Letter })
).subscribe((e: Space) => {
  // console.log(`Event ${JSON.stringify(e)}`);
  renderer.resetSuggestions();
});
