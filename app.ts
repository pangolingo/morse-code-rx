
declare var rxjs: any;

// import { fromEvent } from 'rxjs';
// import { throttleTime, scan } from 'rxjs/operators';
const UNIT = 100; // 1/10 of a second
const DOT_CHAR = '∙';
const DASH_CHAR = '⁃';
const UNKNOWN_CHAR = '𖡄';

class MyRenderer {
  signals = [];
  signalDomEl: HTMLElement;
  chars = [];
  charsDomEl: HTMLElement;
  suggestionsDomEl: HTMLElement;
  charParts = [];

  constructor(){
    this.signalDomEl = document.getElementById('signals');
    this.charsDomEl = document.getElementById('chars')
    this.suggestionsDomEl = document.getElementById('suggestions')
  }

  addSignal(signal) {
    this.signals.push(signal);
    this.render();
  }

  addChar(char) {
    this.chars.push(char);
    this.render();
  }

  honeSuggestions(signal) {
    this.charParts.push(signal);
    this.render();
  }
  resetSuggestions() {
    this.charParts = [];
  }

  mapSignalsToRenderable() {
    return this.signals.map(s => {
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
          throw new Error(`Unknown signal: ${s}`);
      }
    })
  }

  render() {
    if (this.charParts.length < 1) {
      return;
    } else {
      
    }
    const suggestions = getSuggestions(this.charParts, root);
    this.signalDomEl.value = this.mapSignalsToRenderable().join('');
    const probableSuggestion = (suggestions.length > 0 ? suggestions[0].value : UNKNOWN_CHAR);
    this.charsDomEl.value = this.chars.join('') + probableSuggestion;
    if(!suggestions.map){
      console.error(suggestions)
    }
    this.suggestionsDomEl.value = suggestions.map(s => { return `${s.value}: ${s.marks.join('')}`}).join('\n');
  }
}

const renderer = new MyRenderer();

const getSpaceByTime = (dur) => {
  // word space is 7 units
  // letter space is 3 units
  // mark space is 1 unit
  if(dur > UNIT * 6.5) {
    return 'word_space';
  }
  if(dur > UNIT * 2.5) {
    return 'letter_space';
  }
  return 'mark_space';
}
const getMarkByTime = (dur) => {
  // dash is 3 units
  // dot is 1 unit
  if(dur > UNIT * 2.5) {
    return 'dash';
  }
  return 'dot';
}

class MorseNode {
  value;
  dashLeaf;
  dotLeaf;
  constructor(value, dotLeaf, dashLeaf) {
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

const decode = (markArr, morseTree) => {
  let tree = morseTree;
  for(let i = 0;i < markArr.length; i++){
    if(markArr[i] === 'dot'){
      tree = tree.dotLeaf;
    } else if(markArr[i] === 'dash'){
      tree = tree.dashLeaf;
    } else {
      throw new Error(`Invalid mark: ${markArr[i]}`)
    }
    if(tree === null){
      // no matching character
      console.warn("no matching character");
      return UNKNOWN_CHAR;
    }
  }
  return tree.value;
}

const getSuggestions = (charParts, morseTree) => {
  // traverse tree to end of charparts
  let tree = morseTree;
  for(let i = 0;i < charParts.length; i++){
    if(charParts[i] === 'dot'){
      tree = tree.dotLeaf;
    } else if(charParts[i] === 'dash'){
      tree = tree.dashLeaf;
    } else {
      throw new Error(`Invalid mark: ${charParts[i]}`)
    }
    if(tree === null){
      // no matching character
      console.warn("no matching character");
      return [];
    }
  }

  // then traverse and accumulate all possible options
  const possibleTargets = [];
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

  const traverse = (tree, possibleTargets, markStack, nodeMarkStr) => {
    if(tree == null) {
      return;
    }
    console.log(tree.value, nodeMarkStr);
    markStack.push(nodeMarkStr)
    possibleTargets.push({ value: tree.value, marks: [...markStack]} );

    traverse(tree.dotLeaf, possibleTargets, markStack, DOT_CHAR);
    traverse(tree.dashLeaf, possibleTargets, markStack, DASH_CHAR);

    markStack.pop();
  }

  const markStack = charParts.map(p => {
    if(p === 'dot') {
      return DOT_CHAR;
    }
    if(p === 'dash') {
      return DASH_CHAR;
    }
    throw new Error(`Unknown char part: ${p}`);
  });
  traverse(tree, possibleTargets, markStack, "");
  return possibleTargets
}

const getCharacterFromMarks = (marks) => {
  
}

const stream1 = rxjs
  .merge(
    rxjs.fromEvent(document, "keydown").pipe(
      // rxjs.operators.scan(count => count + 1, 0)
      rxjs.operators.filter(e => {
        return e.code === "Space";
      }),
      // rxjs.operators.map(e => ["press", new Date()])
      rxjs.operators.map(e => "press"),
      rxjs.operators.timestamp()
    ),
    rxjs.fromEvent(document, "keyup").pipe(
      // rxjs.operators.scan(count => count + 1, 0)
      rxjs.operators.filter(e => {
        return e.code === "Space";
      }),
      // rxjs.operators.map(e => ["release", new Date()])
      rxjs.operators.map(e => "release"),
      rxjs.operators.timestamp()
    )
  )
  .pipe(
    rxjs.operators.distinctUntilChanged(undefined, e => e.value),
    //rxjs.operators.bufferCount(2), // consider groupBy instead
    rxjs.operators.pairwise(),
    rxjs.operators.map(evs => {
      // const delta = evs[2][1] - evs[1][1];
      // return delta;
      const delta = evs[1].timestamp - evs[0].timestamp;
      if(evs[0].value === 'release' && evs[1].value === 'press'){
         return getSpaceByTime(delta);
      }
      if(evs[0].value === 'press' && evs[1].value === 'release'){
         return getMarkByTime(delta);
      }
      throw new Error(`Unknown event pair: ${evs[0].value}, ${evs[1].value}`);
    })
  )

const stream2 = stream1.pipe(
    //rxjs.operators.tap(e => console.log('tapped'))
    rxjs.operators.bufferWhen(() => {
      return stream1.pipe(
        rxjs.operators.filter(e => { return e === 'word_space' || e === 'letter_space' })
      )
    }),
    rxjs.operators.map(eArr => { return eArr.filter(eA => {
        return eA === 'dot' || eA === 'dash'
    }) })
  );

// print characters
stream2.subscribe(e => {
  const decoded = decode(e, root)
  // console.log(decoded)
  renderer.addChar(decoded)
})
// space characters
// print characters
stream1.pipe(
  rxjs.operators.filter(e => { return e === 'word_space' })
).subscribe(e => {
  // TODO: this screws up
  // renderer.addChar(" ")
})

// print signals
stream1.subscribe(e => {
  // console.log(`Event ${JSON.stringify(e)}`);
  renderer.addSignal(e);
});

// print suggestions
stream1.pipe(
  rxjs.operators.filter(e => { return e === 'dot' || e === 'dash' })
).subscribe(e => {
  // console.log(`Event ${JSON.stringify(e)}`);
  renderer.honeSuggestions(e);
});
stream1.pipe(
  rxjs.operators.filter(e => { return e === 'word_space' || e === 'letter_space' })
).subscribe(e => {
  // console.log(`Event ${JSON.stringify(e)}`);
  renderer.resetSuggestions(e);
});
