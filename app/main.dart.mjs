// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: () => globalThis.Math,
      AC: Function.prototype.call.bind(DataView.prototype.setUint32),
      AD: x0 => x0.devicePixelRatio,
      AE: (x0,x1) => x0.observe(x1),
      AF: x0 => x0.wheelDeltaY,
      AG: (x0,x1) => x0.querySelectorAll(x1),
      AH: x0 => x0.clipboard,
      AI: x0 => new WeakRef(x0),
      AJ: (x0,x1,x2) => x0.sqlite3_extended_result_codes(x1,x2),
      AK: () => globalThis.crypto,
      AL: (x0,x1) => { x0.responseType = x1 },
      AM: (x0,x1) => x0.decode(x1),
      AN: (x0,x1) => x0.querySelector(x1),
      B: s => printToConsole(s),
      BB: (x0,x1) => x0.prepend(x1),
      BC: Function.prototype.call.bind(DataView.prototype.setInt16),
      BD: x0 => x0.height,
      BE: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      BF: x0 => x0.wheelDeltaX,
      BG: (x0,x1) => x0.requestAnimationFrame(x1),
      BH: (x0,x1) => x0.writeText(x1),
      BI: x0 => x0.deref(),
      BJ: (x0,x1,x2,x3,x4) => x0.sqlite3_open_v2(x1,x2,x3,x4),
      BK: l => new DataView(new ArrayBuffer(l)),
      BL: x0 => x0.vendor,
      BM: x0 => x0.duration,
      BN: (x0,x1) => x0.append(x1),
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      CC: Function.prototype.call.bind(DataView.prototype.setUint16),
      CD: x0 => x0.width,
      CE: x0 => new ResizeObserver(x0),
      CF: x0 => x0.key,
      CG: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      CH: x0 => x0.unlock(),
      CI: () => globalThis.WeakRef,
      CJ: x0 => x0.sqlite3_initialize(),
      CK: () => globalThis.WebAssembly,
      CL: x0 => x0.navigator,
      CM: x0 => x0.image,
      CN: (x0,x1) => { x0.id = x1 },
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: b => !!b,
      DC: Function.prototype.call.bind(DataView.prototype.setUint8),
      DD: x0 => x0.screen,
      DE: (x0,x1) => x0.getPropertyValue(x1),
      DF: x0 => x0.pressure,
      DG: x0 => x0.now(),
      DH: (x0,x1) => x0.lock(x1),
      DI: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      DJ: (x0,x1,x2,x3) => x0.dart_sqlite3_register_vfs(x1,x2,x3),
      DK: x0 => x0.href,
      DL: () => globalThis.window,
      DM: () => globalThis.window.ImageDecoder,
      DN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      EC: Function.prototype.call.bind(DataView.prototype.setInt8),
      ED: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      EE: x0 => globalThis.parseFloat(x0),
      EF: x0 => x0.tiltY,
      EG: x0 => x0.performance,
      EH: x0 => x0.orientation,
      EI: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      EJ: (x0,x1) => new URL(x0,x1),
      EK: x0 => x0.pathname,
      EL: (x0,x1,x2,x3) => x0.putImageData(x1,x2,x3),
      EM: (x0,x1,x2) => x0.insertBefore(x1,x2),
      EN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      F: () => new Error().stack,
      FB: (x0,x1) => x0.focus(x1),
      FC: Function.prototype.call.bind(DataView.prototype.getInt8),
      FD: x0 => x0.tabIndex,
      FE: (x0,x1) => x0.getComputedStyle(x1),
      FF: x0 => x0.tiltX,
      FG: (d, digits) => d.toFixed(digits),
      FH: (x0,x1) => x0.querySelector(x1),
      FI: (o, p) => p in o,
      FJ: (x0,x1) => globalThis.fetch(x0,x1),
      FK: (x0,x1) => x0.openCursor(x1),
      FL: x0 => x0.arrayBuffer(),
      FM: x0 => x0.id,
      FN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      G: s => JSON.stringify(s),
      GB: () => ({}),
      GC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      GD: (x0,x1) => x0.contains(x1),
      GE: x0 => x0.documentElement,
      GF: x0 => x0.pointerType,
      GG: x0 => x0.maxHeight,
      GH: (x0,x1) => { x0.title = x1 },
      GI: x0 => x0.groups,
      GJ: (x0,x1) => x0.sqlite3session_delete(x1),
      GK: x0 => x0.arrayBuffer(),
      GL: (x0,x1) => x0.transferFromImageBitmap(x1),
      GM: x0 => x0.offsetHeight,
      GN: (x0,x1) => { x0.onerror = x1 },
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: (o, p, v) => o[p] = v,
      HC: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      HD: x0 => x0.activeElement,
      HE: x0 => x0.computedStyleMap(),
      HF: x0 => x0.pointerId,
      HG: x0 => x0.maxWidth,
      HH: (x0,x1) => x0.vibrate(x1),
      HI: (x0,x1,x2) => x0.transaction(x1,x2),
      HJ: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      HK: () => globalThis.Blob,
      HL: x0 => x0.height,
      HM: x0 => x0.offsetWidth,
      HN: (x0,x1) => { x0.oncancel = x1 },
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: () => [],
      IC: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      ID: x0 => x0.parentNode,
      IE: (x0,x1) => x0.get(x1),
      IF: x0 => x0.getCoalescedEvents(),
      IG: x0 => x0.minHeight,
      IH: x0 => x0.arrayBuffer(),
      II: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      IJ: (x0,x1) => x0.unregister(x1),
      IK: x0 => x0.value,
      IL: x0 => x0.width,
      IM: x0 => x0.stopPropagation(),
      IN: (x0,x1) => { x0.onchange = x1 },
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: (a, i) => a.push(i),
      JC: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      JD: x0 => x0.tagName,
      JE: (o, p) => p in o,
      JF: (x0,x1) => x0.getModifierState(x1),
      JG: x0 => x0.minWidth,
      JH: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      JI: x0 => x0.abort(),
      JJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      JK: x0 => x0.key,
      JL: x0 => x0.rasterEndMilliseconds,
      JM: x0 => x0.disabled,
      JN: x0 => globalThis.URL.createObjectURL(x0),
      K: o => o,
      KB: x0 => new Int8Array(x0),
      KC: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      KD: x0 => x0.target,
      KE: (x0,x1) => { x0.textContent = x1 },
      KF: s => s.trimLeft(),
      KG: (x0,x1) => x0.removeProperty(x1),
      KH: x0 => x0.status,
      KI: x0 => x0.commit(),
      KJ: x0 => new FinalizationRegistry(x0),
      KK: x0 => x0.continue(),
      KL: x0 => x0.rasterStartMilliseconds,
      KM: (x0,x1) => { x0.min = x1 },
      KN: x0 => x0.type,
      L: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      LB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      LC: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      LD: x0 => x0.clientY,
      LE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      LF: s => s.toUpperCase(),
      LG: (x0,x1) => x0.add(x1),
      LH: (x0,x1) => x0.fetch(x1),
      LI: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      LJ: () => globalThis.FinalizationRegistry,
      LK: x0 => x0.error,
      LL: x0 => x0.imageBitmaps,
      LM: (x0,x1) => { x0.max = x1 },
      LN: x0 => x0.lastModified,
      M: x0 => x0.index,
      MB: x0 => new Uint8Array(x0),
      MC: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      MD: x0 => x0.clientX,
      ME: x0 => x0.matches,
      MF: x0 => x0.pop(),
      MG: x0 => x0.data,
      MH: x0 => x0.content,
      MI: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      MJ: (x0,x1) => x0.sqlite3changeset_finalize(x1),
      MK: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      ML: (x0,x1) => { x0.height = x1 },
      MM: (x0,x1) => { x0.disabled = x1 },
      MN: x0 => x0.size,
      N: o => String(o),
      NB: x0 => new Uint8ClampedArray(x0),
      NC: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      ND: (x0,x1,x2) => x0.setAttribute(x1,x2),
      NE: (x0,x1) => x0.matchMedia(x1),
      NF: x0 => x0.flags,
      NG: (x0,x1) => { x0.scrollTop = x1 },
      NH: x0 => x0.document,
      NI: (x0,x1) => { x0.onerror = x1 },
      NJ: x0 => x0.exports,
      NK: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      NL: (x0,x1) => { x0.width = x1 },
      NM: (x0,x1) => { x0.scrollLeft = x1 },
      NN: x0 => x0.name,
      O: o => o === undefined,
      OB: x0 => new Int16Array(x0),
      OC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      OD: x0 => x0.getBoundingClientRect(),
      OE: x0 => x0.matches,
      OF: (a, s) => a.join(s),
      OG: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      OH: () => typeof dartUseDateNowForTicks !== "undefined",
      OI: x0 => new DOMException(x0),
      OJ: x0 => x0.call(),
      OK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      OL: x0 => x0.convertToBlob(),
      OM: (x0,x1) => { x0.spellcheck = x1 },
      ON: (x0,x1) => x0.item(x1),
      P: (x0,x1) => x0.exec(x1),
      PB: x0 => new Uint16Array(x0),
      PC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      PD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      PE: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      PF: (x0,x1) => x0.error(x1),
      PG: (x0,x1) => { x0.value = x1 },
      PH: () => Date.now(),
      PI: x0 => x0.error,
      PJ: x0 => x0.instance,
      PK: x0 => x0.result,
      PL: (x0,x1,x2) => new ImageData(x0,x1,x2),
      PM: (x0,x1) => { x0.disabled = x1 },
      PN: x0 => x0.length,
      Q: (x0,x1) => { x0.lastIndex = x1 },
      QB: x0 => new Int32Array(x0),
      QC: (x0,x1) => x0.querySelector(x1),
      QD: s => new Date(s * 1000).getTimezoneOffset() * 60,
      QE: f => f.dartFunction,
      QF: () => globalThis.console,
      QG: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      QH: () => 1000 * performance.now(),
      QI: (x0,x1) => { x0.onabort = x1 },
      QJ: (x0,x1,x2) => x0.instantiateStreaming(x1,x2),
      QK: (x0,x1) => globalThis.IDBKeyRange.bound(x0,x1),
      QL: (x0,x1) => x0.getContext(x1),
      QM: x0 => x0.canvasKitMaximumSurfaces,
      QN: x0 => x0.files,
      R: o => o,
      RB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      RC: (x0,x1) => x0.item(x1),
      RD: Date.now,
      RE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      RF: s => s.trimRight(),
      RG: (x0,x1) => { x0.value = x1 },
      RH: x0 => new Uint8Array(x0),
      RI: (x0,x1) => { x0.oncomplete = x1 },
      RJ: (o, p, v) => o[p] = v,
      RK: x0 => x0.length,
      RL: (x0,x1) => new OffscreenCanvas(x0,x1),
      RM: x0 => x0.hostElement,
      RN: x0 => x0.target,
      S: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      SB: x0 => new Uint32Array(x0),
      SC: x0 => x0.length,
      SD: (handle) => clearTimeout(handle),
      SE: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SF: x0 => x0.blur(),
      SG: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      SH: (x0,x1,x2) => x0.slice(x1,x2),
      SI: (x0,x1) => x0.objectStore(x1),
      SJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      SK: (x0,x1) => x0.get(x1),
      SL: x0 => x0.allocationSize(),
      SM: x0 => x0.location,
      SN: (x0,x1) => x0.replaceChildren(x1),
      T: o => o instanceof RegExp,
      TB: x0 => new Float32Array(x0),
      TC: (x0,x1) => x0.querySelectorAll(x1),
      TD: (x0,x1) => x0.closest(x1),
      TE: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      TF: x0 => x0.button,
      TG: x0 => x0.value,
      TH: (x0,x1) => x0.decode(x1),
      TI: x0 => x0.buffer,
      TJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      TK: (x0,x1) => x0.index(x1),
      TL: (x0,x1) => x0.copyTo(x1),
      TM: (x0,x1) => x0.getModifierState(x1),
      TN: (x0,x1,x2) => x0.setAttribute(x1,x2),
      U: (string, times) => string.repeat(times),
      UB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      UC: (x0,x1) => x0.getAttribute(x1),
      UD: x0 => x0.bottom,
      UE: (o, i) => o[i],
      UF: x0 => x0.innerHeight,
      UG: x0 => x0.selectionDirection,
      UH: (x0,x1) => x0.adoptText(x1),
      UI: (x0,x1) => x0.sqlite3_errstr(x1),
      UJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3,x4) { return wasmFunction(f,arguments.length,x0,x1,x2,x3,x4) }),
      UK: x0 => x0.openKeyCursor(),
      UL: (x0,x1) => { x0.height = x1 },
      UM: x0 => x0.metaKey,
      UN: (x0,x1) => { x0.accept = x1 },
      V: o => o,
      VB: x0 => new Float64Array(x0),
      VC: x0 => x0.remove(),
      VD: x0 => x0.top,
      VE: o => o.length,
      VF: x0 => x0.innerWidth,
      VG: x0 => x0.selectionStart,
      VH: x0 => x0.first(),
      VI: (x0,x1) => x0.sqlite3_errmsg(x1),
      VJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      VK: x0 => x0.primaryKey,
      VL: (x0,x1) => { x0.width = x1 },
      VM: x0 => x0.altKey,
      VN: (x0,x1) => { x0.multiple = x1 },
      W: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      WB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      WC: (x0,x1) => x0.appendChild(x1),
      WD: x0 => x0.right,
      WE: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      WF: x0 => x0.height,
      WG: x0 => x0.selectionEnd,
      WH: x0 => x0.next(),
      WI: (x0,x1) => x0.sqlite3_error_offset(x1),
      WJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3) { return wasmFunction(f,arguments.length,x0,x1,x2,x3) }),
      WK: (x0,x1,x2) => x0.open(x1,x2),
      WL: (x0,x1) => x0.toDataURL(x1),
      WM: x0 => x0.ctrlKey,
      WN: (x0,x1) => { x0.type = x1 },
      X: x0 => x0.dotAll,
      XB: x0 => new ArrayBuffer(x0),
      XC: (x0,x1) => x0.append(x1),
      XD: x0 => x0.left,
      XE: x0 => x0.language,
      XF: x0 => x0.width,
      XG: x0 => x0.value,
      XH: x0 => x0.current(),
      XI: (x0,x1) => x0.sqlite3_extended_errcode(x1),
      XJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3) { return wasmFunction(f,arguments.length,x0,x1,x2,x3) }),
      XK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      XL: (x0,x1,x2,x3) => x0.drawImage(x1,x2,x3),
      XM: x0 => x0.isComposing,
      XN: (x0,x1,x2) => x0.addEventListener(x1,x2),
      Y: x0 => x0.unicode,
      YB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      YC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      YD: x0 => x0.clientY,
      YE: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      YF: x0 => x0.clientHeight,
      YG: x0 => x0.selectionDirection,
      YH: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      YI: (x0,x1) => x0.sqlite3_close_v2(x1),
      YJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      YK: (x0,x1) => { x0.onupgradeneeded = x1 },
      YL: (x0,x1) => x0.getContext(x1),
      YM: x0 => x0.code,
      YN: (x0,x1) => x0.removeChild(x1),
      Z: x0 => x0.ignoreCase,
      ZB: (x0,x1,x2) => new DataView(x0,x1,x2),
      ZC: x0 => x0.style,
      ZD: x0 => x0.clientX,
      ZE: () => globalThis.window.FinalizationRegistry,
      ZF: x0 => x0.clientWidth,
      ZG: x0 => x0.selectionStart,
      ZH: x0 => x0.v8BreakIterator,
      ZI: (x0,x1) => x0.sqlite3_changes(x1),
      ZJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      ZK: x0 => ({autoIncrement: x0}),
      ZL: x0 => x0.displayHeight,
      ZM: x0 => x0.repeat,
      ZN: x0 => x0.firstChild,
      a: x0 => x0.multiline,
      aB: (o, p) => o[p],
      aC: x0 => x0.debugShowSemanticsNodes,
      aD: x0 => x0.changedTouches,
      aE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      aF: (x0,x1) => { x0.content = x1 },
      aG: x0 => x0.selectionEnd,
      aH: () => globalThis.Intl,
      aI: (x0,x1) => x0.sqlite3_finalize(x1),
      aJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      aK: (x0,x1,x2) => x0.createObjectStore(x1,x2),
      aL: x0 => x0.format,
      aM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      aN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      b: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      bB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      bC: (x0,x1) => x0.warn(x1),
      bD: x0 => x0.offsetY,
      bE: x0 => new window.FinalizationRegistry(x0),
      bF: (x0,x1) => { x0.name = x1 },
      bG: x0 => x0.keyCode,
      bH: (x0,x1) => x0.segment(x1),
      bI: (x0,x1) => x0.sqlite3_reset(x1),
      bJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      bK: x0 => ({unique: x0}),
      bL: x0 => x0.displayWidth,
      bM: x0 => x0.userAgent,
      bN: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      c: () => globalThis.Promise.resolve(),
      cB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      cC: x0 => x0.console,
      cD: x0 => x0.offsetX,
      cE: (x0,x1) => x0.unregister(x1),
      cF: x0 => x0.head,
      cG: (x0,x1) => x0.scrollIntoView(x1),
      cH: x0 => x0.index,
      cI: (x0,x1,x2) => x0.sqlite3_column_name(x1,x2),
      cJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3) { return wasmFunction(f,arguments.length,x0,x1,x2,x3) }),
      cK: (x0,x1,x2,x3) => x0.createIndex(x1,x2,x3),
      cL: x0 => globalThis.fetch(x0),
      cM: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      cN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      d: (x0,x1) => x0.then(x1),
      dB: o => o.byteOffset,
      dC: () => globalThis.window,
      dD: x0 => x0.type,
      dE: (x0,x1) => x0.contains(x1),
      dF: (x0,x1) => x0.removeChild(x1),
      dG: x0 => x0.multiViewEnabled,
      dH: x0 => x0.next(),
      dI: (x0,x1,x2) => x0.sqlite3_column_blob(x1,x2),
      dJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3) { return wasmFunction(f,arguments.length,x0,x1,x2,x3) }),
      dK: (x0,x1) => x0.createObjectStore(x1),
      dL: x0 => x0.arrayBuffer(),
      dM: (x0,x1) => x0.canShare(x1),
      dN: x0 => ({type: x0}),
      e: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      eB: o => o.buffer,
      eC: (o, c) => o instanceof c,
      eD: x0 => x0.maxTouchPoints,
      eE: (s) => +s,
      eF: x0 => x0.firstChild,
      eG: (x0,x1) => x0.replaceWith(x1),
      eH: x0 => x0.value,
      eI: (x0,x1,x2) => x0.sqlite3_column_bytes(x1,x2),
      eJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      eK: x0 => x0.oldVersion,
      eL: (x0,x1) => x0.revokeObjectURL(x1),
      eM: (x0,x1) => x0.share(x1),
      eN: (x0,x1) => new Blob(x0,x1),
      f: (x0,x1) => x0.didCreateEngineInitializer(x1),
      fB: Function.prototype.call.bind(DataView.prototype.getUint8),
      fC: (x0,x1) => x0[x1],
      fD: x0 => x0.platform,
      fE: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      fF: x0 => x0.viewConstraints,
      fG: (x0,x1) => { x0.type = x1 },
      fH: x0 => x0.done,
      fI: (x0,x1,x2) => x0.sqlite3_column_text(x1,x2),
      fJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      fK: () => globalThis.indexedDB,
      fL: (x0,x1) => { x0.src = x1 },
      fM: x0 => x0.message,
      fN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: (b, o) => new DataView(b, o),
      gC: x0 => x0.length,
      gD: x0 => x0.body,
      gE: s => s.trim(),
      gF: x0 => x0.hostElement,
      gG: (x0,x1) => { x0.className = x1 },
      gH: (o, m, a) => o[m].apply(o, a),
      gI: (x0,x1,x2) => x0.sqlite3_column_double(x1,x2),
      gJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      gK: (x0,x1) => x0.delete(x1),
      gL: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      gM: x0 => x0.name,
      gN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      h: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      hB: (b, o, l) => new DataView(b, o, l),
      hC: (string, token) => string.split(token),
      hD: () => globalThis.document,
      hE: x0 => x0.classList,
      hF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      hG: (x0,x1) => { x0.tabIndex = x1 },
      hH: x0 => x0.iterator,
      hI: x0 => globalThis.Number(x0),
      hJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      hK: (x0,x1) => x0.getKey(x1),
      hL: x0 => x0.naturalHeight,
      hM: (x0,x1) => x0.createElement(x1),
      hN: (x0,x1) => { x0.draggable = x1 },
      i: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      iB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      iC: o => o instanceof Array,
      iD: (x0,x1,x2) => x0.addEventListener(x1,x2),
      iE: x0 => x0.preventDefault(),
      iF: x0 => ({runApp: x0}),
      iG: (x0,x1) => { x0.name = x1 },
      iH: () => globalThis.Symbol,
      iI: (x0,x1,x2) => x0.sqlite3_column_int64(x1,x2),
      iJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      iK: (x0,x1) => ({name: x0,length: x1}),
      iL: x0 => x0.naturalWidth,
      iM: x0 => x0.click(),
      iN: x0 => x0.length,
      j: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      jB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      jC: (a, i) => a[i],
      jD: x0 => x0.hasFocus(),
      jE: x0 => x0.parent,
      jF: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      jG: (x0,x1) => { x0.placeholder = x1 },
      jH: (x0,x1) => new Intl.Segmenter(x0,x1),
      jI: (x0,x1,x2) => x0.sqlite3_column_type(x1,x2),
      jJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      jK: (x0,x1) => x0.update(x1),
      jL: x0 => x0.decode(),
      jM: x0 => x0.remove(),
      jN: x0 => x0.getReader(),
      k: x0 => new Promise(x0),
      kB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      kC: a => a.length,
      kD: x0 => x0.relatedTarget,
      kE: x0 => x0.timeStamp,
      kF: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      kG: (x0,x1) => { x0.autocomplete = x1 },
      kH: x0 => x0.Segmenter,
      kI: (x0,x1) => x0.sqlite3_column_count(x1),
      kJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      kK: x0 => x0.name,
      kL: (x0,x1) => { x0.decoding = x1 },
      kM: (o, a) => o + a,
      kN: x0 => x0.value,
      l: (x0,x1,x2) => x0.call(x1,x2),
      lB: (t, s) => t.set(s),
      lC: (x0,x1) => x0.test(x1),
      lD: x0 => x0.shiftKey,
      lE: (x0,x1) => x0.hasAttribute(x1),
      lF: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      lG: (x0,x1) => { x0.name = x1 },
      lH: x0 => x0.buffer,
      lI: (x0,x1) => x0.sqlite3_step(x1),
      lJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      lK: x0 => globalThis.IDBKeyRange.only(x0),
      lL: (x0,x1) => { x0.crossOrigin = x1 },
      lM: x0 => x0.children,
      lN: x0 => x0.done,
      m: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      mB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      mC: x0 => x0.userAgent,
      mD: (decoder, codeUnits) => decoder.decode(codeUnits),
      mE: x0 => x0.buttons,
      mF: o => o.byteLength,
      mG: (x0,x1) => { x0.placeholder = x1 },
      mH: x0 => x0.wasmMemory,
      mI: (x0,x1,x2,x3,x4) => x0.dart_sqlite3_bind_blob(x1,x2,x3,x4),
      mJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      mK: (x0,x1,x2) => x0.put(x1,x2),
      mL: (x0,x1) => x0.createObjectURL(x1),
      mM: x0 => x0.body,
      mN: x0 => x0.read(),
      n: x0 => new Array(x0),
      nB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      nC: x0 => x0.navigator,
      nD: () => new TextDecoder("utf-8", {fatal: true}),
      nE: x0 => x0.ctrlKey,
      nF: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      nG: (x0,x1) => { x0.action = x1 },
      nH: () => globalThis.window._flutter_skwasmInstance,
      nI: (x0,x1) => x0.dart_sqlite3_malloc(x1),
      nJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      nK: (x0,x1) => x0.put(x1),
      nL: x0 => x0.URL,
      nM: (x0,x1) => { x0.download = x1 },
      nN: x0 => x0.body,
      o: o => [o],
      oB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      oC: Function.prototype.call.bind(String.prototype.toLowerCase),
      oD: () => new TextDecoder("utf-8", {fatal: false}),
      oE: x0 => x0.y,
      oF: x0 => x0.history,
      oG: (x0,x1) => { x0.method = x1 },
      oH: () => new TextDecoder(),
      oI: (x0,x1,x2,x3,x4) => x0.dart_sqlite3_bind_text(x1,x2,x3,x4),
      oJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      oK: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      oL: x0 => new Blob(x0),
      oM: (x0,x1) => { x0.display = x1 },
      oN: x0 => x0.assetBase,
      p: (o0, o1) => [o0, o1],
      pB: Function.prototype.call.bind(DataView.prototype.getUint32),
      pC: Object.is,
      pD: (a, i, v) => a[i] = v,
      pE: x0 => x0.x,
      pF: x0 => x0.search,
      pG: (x0,x1) => { x0.noValidate = x1 },
      pH: (a, i) => a.splice(i, 1),
      pI: (x0,x1,x2,x3) => x0.sqlite3_bind_double(x1,x2,x3),
      pJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3,x4) { return wasmFunction(f,arguments.length,x0,x1,x2,x3,x4) }),
      pK: (a, s, e) => a.slice(s, e),
      pL: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      pM: x0 => x0.style,
      pN: x0 => x0.loader,
      q: (o0, o1, o2) => [o0, o1, o2],
      qB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      qC: x0 => x0.vendor,
      qD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      qE: x0 => x0.scrollTop,
      qF: x0 => x0.location,
      qG: (x0,x1) => x0.removeAttribute(x1),
      qH: a => a.pop(),
      qI: (x0,x1,x2,x3) => x0.sqlite3_bind_int64(x1,x2,x3),
      qJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3) { return wasmFunction(f,arguments.length,x0,x1,x2,x3) }),
      qK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qL: x0 => new window.ImageDecoder(x0),
      qM: (x0,x1) => { x0.href = x1 },
      qN: () => globalThis._flutter,
      r: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      rB: Function.prototype.call.bind(DataView.prototype.getInt32),
      rC: (x0,x1) => x0.createTextNode(x1),
      rD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      rE: x0 => x0.offsetTop,
      rF: x0 => x0.pathname,
      rG: x0 => x0.isConnected,
      rH: (map, o, v) => map.set(o, v),
      rI: x0 => globalThis.BigInt(x0),
      rJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3) { return wasmFunction(f,arguments.length,x0,x1,x2,x3) }),
      rK: x0 => new Blob(x0),
      rL: x0 => x0.name,
      rM: () => globalThis.document,
      s: (x0,x1,x2) => { x0[x1] = x2 },
      sB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      sC: (x0,x1) => { x0.id = x1 },
      sD: x0 => x0.visibilityState,
      sE: x0 => x0.scrollLeft,
      sF: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      sG: x0 => x0.click(),
      sH: (map, o) => map.get(o),
      sI: (x0,x1,x2) => x0.sqlite3_bind_null(x1,x2),
      sJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3) { return wasmFunction(f,arguments.length,x0,x1,x2,x3) }),
      sK: () => new FileReader(),
      sL: x0 => x0.repetitionCount,
      sM: (x0,x1,x2) => ({files: x0,title: x1,text: x2}),
      t: (o, p) => o[p],
      tB: o => o instanceof Uint16Array,
      tC: (x0,x1) => { x0.nonce = x1 },
      tD: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      tE: x0 => x0.offsetLeft,
      tF: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      tG: (x0,x1) => x0.getElementsByClassName(x1),
      tH: () => new WeakMap(),
      tI: (x0,x1) => x0.sqlite3_bind_parameter_count(x1),
      tJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      tK: (x0,x1) => x0.readAsArrayBuffer(x1),
      tL: x0 => x0.frameCount,
      tM: (x0,x1) => ({files: x0,text: x1}),
      u: () => globalThis,
      uB: Function.prototype.call.bind(DataView.prototype.getUint16),
      uC: x0 => x0.nonce,
      uD: x0 => x0.disconnect(),
      uE: x0 => x0.offsetParent,
      uF: o => Object.keys(o),
      uG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      uH: x0 => x0.debugSkipFontRetryDelay,
      uI: (x0,x1) => x0.dart_sqlite3_free(x1),
      uJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      uK: x0 => x0.result,
      uL: x0 => x0.selectedTrack,
      uM: (x0,x1) => ({files: x0,title: x1}),
      v: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      vB: o => o instanceof Int16Array,
      vC: () => globalThis.window.flutterConfiguration,
      vD: x0 => new Intl.Locale(x0),
      vE: (o, p, r) => o.replace(p, () => r),
      vF: x0 => x0.state,
      vG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      vH: (x0,x1,x2) => x0.set(x1,x2),
      vI: (x0,x1,x2,x3,x4,x5,x6) => x0.sqlite3_prepare_v3(x1,x2,x3,x4,x5,x6),
      vJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3,x4) { return wasmFunction(f,arguments.length,x0,x1,x2,x3,x4) }),
      vK: () => new XMLHttpRequest(),
      vL: x0 => x0.completed,
      vM: x0 => ({files: x0}),
      w: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      wB: Function.prototype.call.bind(DataView.prototype.getInt16),
      wC: (x0,x1) => x0.attachShadow(x1),
      wD: x0 => x0.region,
      wE: (o, p, r) => o.replaceAll(p, () => r),
      wF: x0 => x0.hash,
      wG: (x0,x1) => x0.dispatchEvent(x1),
      wH: x0 => x0.fontFallbackBaseUrl,
      wI: (x0,x1) => x0.sqlite3_get_autocommit(x1),
      wJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      wK: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      wL: x0 => x0.ready,
      wM: (x0,x1) => ({title: x0,text: x1}),
      x: (x0,x1) => ({addView: x0,removeView: x1}),
      xB: o => o instanceof Uint8ClampedArray,
      xC: (x0,x1) => x0.createElement(x1),
      xD: x0 => x0.script,
      xE: x0 => x0.deltaMode,
      xF: x0 => x0.state,
      xG: (x0,x1) => x0.createEvent(x1),
      xH: (handle) => clearInterval(handle),
      xI: (x0,x1) => x0.sqlite3_last_insert_rowid(x1),
      xJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      xK: x0 => x0.send(),
      xL: x0 => x0.tracks,
      xM: () => ({}),
      y: (l, r) => l === r,
      yB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      yC: x0 => x0.scale,
      yD: x0 => x0.language,
      yE: x0 => x0.deltaY,
      yF: (x0,x1) => x0.go(x1),
      yG: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      yH: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      yI: (x0,x1,x2,x3,x4,x5) => x0.sqlite3_exec(x1,x2,x3,x4,x5),
      yJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      yK: x0 => x0.type,
      yL: x0 => x0.close(),
      yM: (x0,x1,x2) => new File(x0,x1,x2),
      z: x0 => x0.random(),
      zB: Function.prototype.call.bind(DataView.prototype.setInt32),
      zC: x0 => x0.visualViewport,
      zD: x0 => x0.languages,
      zE: x0 => x0.deltaX,
      zF: x0 => x0.parentElement,
      zG: x0 => x0.readText(),
      zH: () => Date.now(),
      zI: (x0,x1,x2,x3) => x0.dart_sqlite3_db_config_int(x1,x2,x3),
      zJ: (x0,x1) => x0.getRandomValues(x1),
      zK: x0 => x0.response,
      zL: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      zM: (x0,x1) => { x0.type = x1 },

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
