// node_modules/ripple/src/runtime/internal/client/constants.js
var ROOT_BLOCK = 1 << 1;
var RENDER_BLOCK = 1 << 2;
var EFFECT_BLOCK = 1 << 3;
var BRANCH_BLOCK = 1 << 4;
var FOR_BLOCK = 1 << 5;
var TRY_BLOCK = 1 << 6;
var IF_BLOCK = 1 << 7;
var SWITCH_BLOCK = 1 << 8;
var COMPOSITE_BLOCK = 1 << 9;
var ASYNC_BLOCK = 1 << 10;
var HEAD_BLOCK = 1 << 11;
var CONTAINS_UPDATE = 1 << 12;
var CONTAINS_TEARDOWN = 1 << 13;
var BLOCK_HAS_RUN = 1 << 14;
var TRACKED = 1 << 15;
var DERIVED = 1 << 16;
var DEFERRED = 1 << 17;
var PAUSED = 1 << 18;
var DESTROYED = 1 << 19;
var CONTROL_FLOW_BLOCK = FOR_BLOCK | IF_BLOCK | SWITCH_BLOCK | TRY_BLOCK | COMPOSITE_BLOCK;
var UNINITIALIZED = Symbol();
var TRACKED_ARRAY = Symbol();
var TRACKED_OBJECT = Symbol();
var COMPUTED_PROPERTY = Symbol();
var ARRAY_SET_INDEX_AT = Symbol();
var MAX_ARRAY_LENGTH = 2 ** 32 - 1;
var DEFAULT_NAMESPACE = "html";

// node_modules/ripple/src/runtime/internal/client/utils.js
var get_descriptor = Object.getOwnPropertyDescriptor;
var get_descriptors = Object.getOwnPropertyDescriptors;
var array_from = Array.from;
var is_array = Array.isArray;
var define_property = Object.defineProperty;
var get_prototype_of = Object.getPrototypeOf;
var structured_clone = structuredClone;
var object_prototype = Object.prototype;
var array_prototype = Array.prototype;
function create_anchor() {
  var t = document.createTextNode("");
  t.__t = "";
  return t;
}
function is_tracked_object(v) {
  return typeof v === "object" && v !== null && typeof v.f === "number";
}

// node_modules/ripple/src/runtime/internal/client/operations.js
var first_child_getter;
var next_sibling_getter;
var document2;
var is_firefox;
function init_operations() {
  var node_prototype = Node.prototype;
  var element_prototype = Element.prototype;
  var event_target_prototype = EventTarget.prototype;
  is_firefox = /Firefox/.test(navigator.userAgent);
  document2 = window.document;
  first_child_getter = get_descriptor(node_prototype, "firstChild").get;
  next_sibling_getter = get_descriptor(node_prototype, "nextSibling").get;
  element_prototype.__click = undefined;
  event_target_prototype.__root = undefined;
}
function first_child(node) {
  return first_child_getter.call(node);
}
function child_frag(node) {
  var child = first_child(node);
  if (child.nodeType === Node.COMMENT_NODE && child.data === "") {
    return next_sibling(child);
  }
  return child;
}
function next_sibling(node) {
  return next_sibling_getter.call(node);
}
function create_text(value = "") {
  return document2.createTextNode(value);
}

// node_modules/ripple/src/utils/events.js
var NON_DELEGATED_EVENTS = new Set([
  "abort",
  "afterprint",
  "beforeprint",
  "beforetoggle",
  "beforeunload",
  "blur",
  "close",
  "command",
  "contextmenu",
  "cuechange",
  "DOMContentLoaded",
  "error",
  "focus",
  "invalid",
  "load",
  "loadend",
  "loadstart",
  "mouseenter",
  "mouseleave",
  "pointerenter",
  "pointerleave",
  "progress",
  "readystatechange",
  "resize",
  "scroll",
  "scrollend",
  "toggle",
  "unload",
  "visibilitychange",
  "canplay",
  "canplaythrough",
  "durationchange",
  "emptied",
  "encrypted",
  "ended",
  "loadeddata",
  "loadedmetadata",
  "loadstart",
  "pause",
  "play",
  "playing",
  "progress",
  "ratechange",
  "seeked",
  "seeking",
  "stalled",
  "suspend",
  "timeupdate",
  "volumechange",
  "waiting",
  "waitingforkey"
]);
function is_non_delegated(event_name) {
  return NON_DELEGATED_EVENTS.has(event_name);
}
function is_capture_event(event_name) {
  var lowered = event_name.toLowerCase();
  return event_name.endsWith("Capture") && lowered !== "gotpointercapture" && lowered !== "lostpointercapture";
}
function event_name_from_capture(event_name) {
  return event_name.slice(0, -7);
}
var PASSIVE_EVENTS = ["touchstart", "touchmove", "wheel", "mousewheel"];
function is_passive_event(name) {
  return PASSIVE_EVENTS.includes(name);
}

// node_modules/esm-env/true.js
var true_default = true;
// node_modules/ripple/src/runtime/internal/client/runtime.js
var FLUSH_MICROTASK = 0;
var active_block = null;
var active_reaction = null;
var active_scope = null;
var active_component = null;
var active_namespace = DEFAULT_NAMESPACE;
var is_mutating_allowed = true;
var old_values = new Map;
var scheduler_mode = FLUSH_MICROTASK;
var is_micro_task_queued = false;
var clock = 0;
var queued_root_blocks = [];
var queued_microtasks = [];
var flush_count = 0;
var active_dependency = null;
var tracking = false;
var teardown = false;
function increment_clock() {
  return ++clock;
}
function set_active_block(block) {
  active_block = block;
}
function set_active_reaction(reaction) {
  active_reaction = reaction;
}
function set_tracking(value) {
  tracking = value;
}
function run_teardown(block) {
  var fn = block.t;
  if (fn !== null) {
    var previous_block = active_block;
    var previous_reaction = active_reaction;
    var previous_tracking = tracking;
    var previous_teardown = teardown;
    try {
      active_block = null;
      active_reaction = null;
      tracking = false;
      teardown = true;
      fn.call(null);
    } finally {
      active_block = previous_block;
      active_reaction = previous_reaction;
      tracking = previous_tracking;
      teardown = previous_teardown;
    }
  }
}
function update_derived(computed) {
  var value = computed.__v;
  if (value === UNINITIALIZED || is_tracking_dirty(computed.d)) {
    value = run_derived(computed);
    if (value !== computed.__v) {
      computed.__v = value;
      computed.c = increment_clock();
    }
  }
}
function destroy_computed_children(computed) {
  var blocks = computed.blocks;
  if (blocks !== null) {
    computed.blocks = null;
    for (var i = 0;i < blocks.length; i++) {
      destroy_block(blocks[i]);
    }
  }
}
function run_derived(computed) {
  var previous_block = active_block;
  var previous_reaction = active_reaction;
  var previous_tracking = tracking;
  var previous_dependency = active_dependency;
  var previous_component = active_component;
  var previous_is_mutating_allowed = is_mutating_allowed;
  try {
    active_block = computed.b;
    active_reaction = computed;
    tracking = true;
    active_dependency = null;
    active_component = computed.co;
    is_mutating_allowed = false;
    destroy_computed_children(computed);
    var value = computed.fn();
    computed.d = active_dependency;
    return value;
  } finally {
    active_block = previous_block;
    active_reaction = previous_reaction;
    tracking = previous_tracking;
    active_dependency = previous_dependency;
    active_component = previous_component;
    is_mutating_allowed = previous_is_mutating_allowed;
  }
}
function handle_error(error, block) {
  var current = block;
  while (current !== null) {
    var state = current.s;
    if ((current.f & TRY_BLOCK) !== 0 && state.c !== null) {
      state.c(error);
      return;
    }
    current = current.p;
  }
  throw error;
}
function run_block(block) {
  var previous_block = active_block;
  var previous_reaction = active_reaction;
  var previous_tracking = tracking;
  var previous_dependency = active_dependency;
  var previous_component = active_component;
  try {
    active_block = block;
    active_reaction = block;
    active_component = block.co;
    destroy_non_branch_children(block);
    run_teardown(block);
    tracking = (block.f & (ROOT_BLOCK | BRANCH_BLOCK)) === 0;
    active_dependency = null;
    var res = block.fn(block.s);
    if (typeof res === "function") {
      block.t = res;
      let current = block;
      while (current !== null && (current.f & CONTAINS_TEARDOWN) === 0) {
        current.f ^= CONTAINS_TEARDOWN;
        current = current.p;
      }
    }
    block.d = active_dependency;
  } catch (error) {
    handle_error(error, block);
  } finally {
    active_block = previous_block;
    active_reaction = previous_reaction;
    tracking = previous_tracking;
    active_dependency = previous_dependency;
    active_component = previous_component;
  }
}
var empty_get_set = { get: undefined, set: undefined };
function tracked(v, block, get, set) {
  if (true_default) {
    return {
      DO_NOT_ACCESS_THIS_OBJECT_DIRECTLY: true,
      a: get || set ? { get, set } : empty_get_set,
      b: block || active_block,
      c: 0,
      f: TRACKED,
      __v: v
    };
  }
  return {
    a: get || set ? { get, set } : empty_get_set,
    b: block || active_block,
    c: 0,
    f: TRACKED,
    __v: v
  };
}
function derived(fn, block, get, set) {
  if (true_default) {
    return {
      DO_NOT_ACCESS_THIS_OBJECT_DIRECTLY: true,
      a: get || set ? { get, set } : empty_get_set,
      b: block || active_block,
      blocks: null,
      c: 0,
      co: active_component,
      d: null,
      f: TRACKED | DERIVED,
      fn,
      __v: UNINITIALIZED
    };
  }
  return {
    a: get || set ? { get, set } : empty_get_set,
    b: block || active_block,
    blocks: null,
    c: 0,
    co: active_component,
    d: null,
    f: TRACKED | DERIVED,
    fn,
    __v: UNINITIALIZED
  };
}
function track(v, get, set, b) {
  if (is_tracked_object(v)) {
    return v;
  }
  if (b === null) {
    throw new TypeError("track() requires a valid component context");
  }
  if (typeof v === "function") {
    return derived(v, b, get, set);
  }
  return tracked(v, b, get, set);
}
function create_dependency(tracked2) {
  var reaction = active_reaction;
  var existing = reaction.d;
  if (existing !== null) {
    reaction.d = existing.n;
    existing.c = tracked2.c;
    existing.t = tracked2;
    existing.n = null;
    return existing;
  }
  return {
    c: tracked2.c,
    t: tracked2,
    n: null
  };
}
function is_tracking_dirty(tracking2) {
  if (tracking2 === null) {
    return false;
  }
  while (tracking2 !== null) {
    var tracked2 = tracking2.t;
    if ((tracked2.f & DERIVED) !== 0) {
      update_derived(tracked2);
    }
    if (tracked2.c > tracking2.c) {
      return true;
    }
    tracking2 = tracking2.n;
  }
  return false;
}
function is_block_dirty(block) {
  var flags = block.f;
  if ((flags & (ROOT_BLOCK | BRANCH_BLOCK)) !== 0) {
    return false;
  }
  if ((flags & BLOCK_HAS_RUN) === 0) {
    block.f ^= BLOCK_HAS_RUN;
    return true;
  }
  return is_tracking_dirty(block.d);
}
function trigger_track_get(fn, v) {
  var previous_is_mutating_allowed = is_mutating_allowed;
  try {
    is_mutating_allowed = false;
    return untrack(() => fn(v));
  } finally {
    is_mutating_allowed = previous_is_mutating_allowed;
  }
}
function flush_updates(root_block) {
  var current = root_block;
  var containing_update = null;
  var effects = [];
  while (current !== null) {
    var flags = current.f;
    if ((flags & CONTAINS_UPDATE) !== 0) {
      current.f ^= CONTAINS_UPDATE;
      containing_update = current;
    }
    if ((flags & PAUSED) === 0 && containing_update !== null) {
      if ((flags & EFFECT_BLOCK) !== 0) {
        effects.push(current);
      } else {
        try {
          if (is_block_dirty(current)) {
            run_block(current);
          }
        } catch (error) {
          handle_error(error, current);
        }
      }
      var child = current.first;
      if (child !== null) {
        current = child;
        continue;
      }
    }
    var parent = current.p;
    current = current.next;
    while (current === null && parent !== null) {
      if (parent === containing_update) {
        containing_update = null;
      }
      current = parent.next;
      parent = parent.p;
    }
  }
  var length = effects.length;
  for (var i = 0;i < length; i++) {
    var effect2 = effects[i];
    var flags = effect2.f;
    try {
      if ((flags & (PAUSED | DESTROYED)) === 0 && is_block_dirty(effect2)) {
        run_block(effect2);
      }
    } catch (error) {
      handle_error(error, effect2);
    }
  }
}
function flush_queued_root_blocks(root_blocks) {
  for (let i = 0;i < root_blocks.length; i++) {
    flush_updates(root_blocks[i]);
  }
}
function flush_microtasks() {
  is_micro_task_queued = false;
  if (queued_microtasks.length > 0) {
    var microtasks = queued_microtasks;
    queued_microtasks = [];
    for (var i = 0;i < microtasks.length; i++) {
      microtasks[i]();
    }
  }
  if (flush_count > 1001) {
    return;
  }
  var previous_queued_root_blocks = queued_root_blocks;
  queued_root_blocks = [];
  flush_queued_root_blocks(previous_queued_root_blocks);
  if (!is_micro_task_queued) {
    flush_count = 0;
  }
  old_values.clear();
}
function queue_microtask(fn) {
  if (!is_micro_task_queued) {
    is_micro_task_queued = true;
    queueMicrotask(flush_microtasks);
  }
  if (fn !== undefined) {
    queued_microtasks.push(fn);
  }
}
function schedule_update(block) {
  if (scheduler_mode === FLUSH_MICROTASK) {
    queue_microtask();
  }
  let current = block;
  while (current !== null) {
    var flags = current.f;
    if ((flags & CONTAINS_UPDATE) !== 0)
      return;
    current.f ^= CONTAINS_UPDATE;
    if ((flags & ROOT_BLOCK) !== 0) {
      break;
    }
    current = current.p;
  }
  queued_root_blocks.push(current);
}
function register_dependency(tracked2) {
  var dependency = active_dependency;
  if (dependency === null) {
    dependency = create_dependency(tracked2);
    active_dependency = dependency;
  } else {
    var current = dependency;
    while (current !== null) {
      if (current.t === tracked2) {
        current.c = tracked2.c;
        return;
      }
      var next = current.n;
      if (next === null) {
        break;
      }
      current = next;
    }
    dependency = create_dependency(tracked2);
    current.n = dependency;
  }
}
function get_derived(computed) {
  update_derived(computed);
  if (tracking) {
    register_dependency(computed);
  }
  var get = computed.a.get;
  if (get !== undefined) {
    computed.__v = trigger_track_get(get, computed.__v);
  }
  return computed.__v;
}
function get(tracked2) {
  if (!is_tracked_object(tracked2)) {
    return tracked2;
  }
  return (tracked2.f & DERIVED) !== 0 ? get_derived(tracked2) : get_tracked(tracked2);
}
function get_tracked(tracked2) {
  var value = tracked2.__v;
  if (tracking) {
    register_dependency(tracked2);
  }
  if (teardown && old_values.has(tracked2)) {
    value = old_values.get(tracked2);
  }
  var get2 = tracked2.a.get;
  if (get2 !== undefined) {
    value = trigger_track_get(get2, value);
  }
  return value;
}
function set(tracked2, value) {
  if (!is_mutating_allowed) {
    throw new Error('Assignments or updates to tracked values are not allowed during computed "track(() => ...)" evaluation');
  }
  var old_value = tracked2.__v;
  if (value !== old_value) {
    var tracked_block = tracked2.b;
    if ((tracked_block.f & CONTAINS_TEARDOWN) !== 0) {
      if (teardown) {
        old_values.set(tracked2, value);
      } else {
        old_values.set(tracked2, old_value);
      }
    }
    let set2 = tracked2.a.set;
    if (set2 !== undefined) {
      value = untrack(() => set2(value, old_value));
    }
    tracked2.__v = value;
    tracked2.c = increment_clock();
    schedule_update(tracked_block);
  }
}
function untrack(fn) {
  var previous_tracking = tracking;
  var previous_dependency = active_dependency;
  tracking = false;
  active_dependency = null;
  try {
    return fn();
  } finally {
    tracking = previous_tracking;
    active_dependency = previous_dependency;
  }
}
function increment(tracked2) {
  set(tracked2, tracked2.__v + 1);
}
function with_scope(block, fn) {
  var previous_scope = active_scope;
  try {
    active_scope = block;
    return fn();
  } finally {
    active_scope = previous_scope;
  }
}
function safe_scope(err = "Cannot access outside of a component context") {
  if (active_scope === null) {
    throw new Error(err);
  }
  return active_scope;
}
function create_component_ctx() {
  return {
    c: null,
    e: null,
    m: false,
    p: active_component
  };
}
function push_component() {
  var component = create_component_ctx();
  active_component = component;
}
function pop_component() {
  var component = active_component;
  component.m = true;
  var effects = component.e;
  if (effects !== null) {
    var length = effects.length;
    for (var i = 0;i < length; i++) {
      var { b: block, fn, r: reaction } = effects[i];
      var previous_block = active_block;
      var previous_reaction = active_reaction;
      try {
        active_block = block;
        active_reaction = reaction;
        effect(fn);
      } finally {
        active_block = previous_block;
        active_reaction = previous_reaction;
      }
    }
  }
  active_component = component.p;
}

// node_modules/ripple/src/runtime/internal/client/events.js
var all_registered_events = new Set;
var root_event_handles = new Set;
var root_target = null;
function get_event_options(options) {
  var event_options = {};
  if (options.capture) {
    event_options.capture = true;
  }
  if (options.once) {
    event_options.once = true;
  }
  if (options.passive) {
    event_options.passive = true;
  }
  if (options.signal) {
    event_options.signal = options.signal;
  }
  return event_options;
}
var last_propagated_event = null;
function handle_event_propagation(event) {
  var handler_element = this;
  var owner_document = handler_element.ownerDocument;
  var event_name = event.type;
  var path = event.composedPath?.() || [];
  var current_target = path[0] || event.target;
  last_propagated_event = event;
  var path_idx = 0;
  var handled_at = last_propagated_event === event && event.__root;
  if (handled_at) {
    var at_idx = path.indexOf(handled_at);
    if (at_idx !== -1 && (handler_element === document || handler_element === window)) {
      event.__root = handler_element;
      return;
    }
    var handler_idx = path.indexOf(handler_element);
    if (handler_idx === -1) {
      return;
    }
    if (at_idx <= handler_idx) {
      path_idx = at_idx;
    }
  }
  current_target = path[path_idx] || event.target;
  if (current_target === handler_element)
    return;
  define_property(event, "currentTarget", {
    configurable: true,
    get() {
      return current_target || owner_document;
    }
  });
  var previous_block = active_block;
  var previous_reaction = active_reaction;
  var previous_tracking = tracking;
  set_active_block(null);
  set_active_reaction(null);
  set_tracking(false);
  try {
    var throw_error;
    var other_errors = [];
    while (current_target !== null) {
      var parent_element = current_target.assignedSlot || current_target.parentNode || current_target.host || null;
      try {
        var delegated = current_target["__" + event_name];
        if (delegated !== undefined && !current_target.disabled) {
          if (is_array(delegated)) {
            for (var i = 0;i < delegated.length; i++) {
              delegated[i].call(current_target, event);
            }
          } else {
            delegated.call(current_target, event);
          }
        }
      } catch (error) {
        if (throw_error) {
          other_errors.push(error);
        } else {
          throw_error = error;
        }
      }
      if (event.cancelBubble || parent_element === handler_element || parent_element === null) {
        break;
      }
      current_target = parent_element;
    }
    if (throw_error) {
      for (let error of other_errors) {
        queueMicrotask(() => {
          throw error;
        });
      }
      throw throw_error;
    }
  } finally {
    set_active_block(previous_block);
    event.__root = handler_element;
    delete event.currentTarget;
    set_active_block(previous_block);
    set_active_reaction(previous_reaction);
    set_tracking(previous_tracking);
  }
}
function create_event(event_name, dom, handler, options) {
  var is_delegated = true;
  if (is_capture_event(event_name)) {
    event_name = event_name_from_capture(event_name);
    if (!("capture" in options) || options.capture !== false) {
      options.capture = true;
    }
  }
  event_name = options.customName && options.customName?.length ? options.customName : event_name.toLowerCase();
  if (options.delegated === false || options.capture || options.passive || options.once || options.signal || is_non_delegated(event_name)) {
    is_delegated = false;
  }
  if (is_delegated) {
    var prop = "__" + event_name;
    var target = dom;
    var current = target[prop];
    if (current === undefined) {
      target[prop] = handler;
    } else if (is_array(current)) {
      if (!current.includes(handler)) {
        current.push(handler);
      }
    } else {
      if (current !== handler) {
        target[prop] = [current, handler];
      }
    }
    delegate([event_name]);
    return () => {
      var handlers = target[prop];
      if (is_array(handlers)) {
        var filtered = handlers.filter((h) => h !== handler);
        target[prop] = filtered.length === 0 ? undefined : filtered.length === 1 ? filtered[0] : filtered;
      } else {
        target[prop] = undefined;
      }
    };
  }
  function target_handler(event) {
    var previous_block = active_block;
    var previous_reaction = active_reaction;
    var previous_tracking = tracking;
    try {
      set_active_block(null);
      set_active_reaction(null);
      set_tracking(false);
      if (!options.capture) {
        handle_event_propagation.call(dom, event);
      }
      if (!event.cancelBubble) {
        return handler?.call(this, event);
      }
    } finally {
      set_active_block(previous_block);
      set_active_reaction(previous_reaction);
      set_tracking(previous_tracking);
    }
  }
  var event_options = get_event_options(options);
  dom.addEventListener(event_name, target_handler, event_options);
  return () => {
    dom.removeEventListener(event_name, target_handler, event_options);
  };
}
function event(event_name, dom, handler) {
  var options = {};
  var event_handler;
  if (typeof handler === "object" && "handleEvent" in handler) {
    ({ handleEvent: event_handler, ...options } = handler);
  } else {
    event_handler = handler;
  }
  return create_event(event_name, dom, event_handler, options);
}
function delegate(events) {
  for (var i = 0;i < events.length; i++) {
    all_registered_events.add(events[i]);
  }
  for (var fn of root_event_handles) {
    fn(events);
  }
}
function handle_root_events(target) {
  var registered_events = new Set;
  root_target = target;
  var event_handle = (events) => {
    for (var i = 0;i < events.length; i++) {
      var event_name = events[i];
      if (registered_events.has(event_name))
        continue;
      registered_events.add(event_name);
      var passive = is_passive_event(event_name);
      var options = { passive };
      target.addEventListener(event_name, handle_event_propagation, options);
    }
  };
  event_handle(array_from(all_registered_events));
  root_event_handles.add(event_handle);
  return () => {
    for (var event_name of registered_events) {
      target.removeEventListener(event_name, handle_event_propagation);
    }
    root_event_handles.delete(event_handle);
    root_target = null;
  };
}

// node_modules/clsx/dist/clsx.mjs
function r(e) {
  var t, f, n = "";
  if (typeof e == "string" || typeof e == "number")
    n += e;
  else if (typeof e == "object")
    if (Array.isArray(e)) {
      var o = e.length;
      for (t = 0;t < o; t++)
        e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
    } else
      for (f in e)
        e[f] && (n && (n += " "), n += f);
  return n;
}
function clsx() {
  for (var e, t, f = 0, n = "", o = arguments.length;f < o; f++)
    (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
  return n;
}

// node_modules/ripple/src/utils/normalize_css_property_name.js
var normalized_properties_cache = new Map;
function normalize_css_property_name(str) {
  if (str.startsWith("--"))
    return str;
  let normalized_result = normalized_properties_cache.get(str);
  if (normalized_result != null) {
    return normalized_result;
  }
  normalized_result = str.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
  normalized_properties_cache.set(str, normalized_result);
  return normalized_result;
}

// node_modules/ripple/src/runtime/internal/client/render.js
function set_text(text, value) {
  var str = value == null ? "" : typeof value === "object" ? value + "" : value;
  if (str !== (text.__t ??= text.nodeValue)) {
    text.__t = str;
    text.nodeValue = str + "";
  }
}
var setters_cache = new Map;
function get_setters(element) {
  var setters = setters_cache.get(element.nodeName);
  if (setters)
    return setters;
  setters_cache.set(element.nodeName, setters = []);
  var descriptors;
  var proto = element;
  var element_proto = Element.prototype;
  while (element_proto !== proto) {
    descriptors = get_descriptors(proto);
    for (var key in descriptors) {
      if (descriptors[key].set) {
        setters.push(key);
      }
    }
    proto = get_prototype_of(proto);
  }
  return setters;
}
function set_style(element, value, prev = {}) {
  if (value == null) {
    element.removeAttribute("style");
  } else if (typeof value !== "string") {
    apply_styles(element, value, prev);
  } else {
    element.style.cssText = value;
  }
}
function set_attribute(element, attribute, value) {
  if (value == null) {
    element.removeAttribute(attribute);
  } else if (typeof value !== "string" && get_setters(element).includes(attribute)) {
    element[attribute] = value;
  } else {
    element.setAttribute(attribute, value);
  }
}
function apply_styles(element, new_styles, prev) {
  const style = element.style;
  for (const key in new_styles) {
    const css_prop = normalize_css_property_name(key);
    const value = String(new_styles[key]);
    if (!(key in prev) || prev[key] !== value) {
      style.setProperty(css_prop, value);
    }
  }
  for (const key in prev) {
    if (!(key in new_styles)) {
      const css_prop = normalize_css_property_name(key);
      style.removeProperty(css_prop);
    }
  }
}
function set_class(dom, value, hash, is_html = true) {
  var class_value = value == null ? hash ?? "" : typeof value === "string" ? value + (hash ? " " + hash : "") : clsx([value, hash]);
  if (value == null && hash === undefined) {
    dom.removeAttribute("class");
  } else {
    if (is_html) {
      dom.className = class_value;
    } else {
      dom.setAttribute("class", class_value);
    }
  }
}

// node_modules/ripple/src/runtime/internal/client/blocks.js
function user_effect(fn) {
  if (active_block === null) {
    throw new Error("effect() must be called within an active context, such as a component or effect");
  }
  var component = active_component;
  if (component !== null && !component.m) {
    var e = component.e ??= [];
    e.push({
      b: active_block,
      fn,
      r: active_reaction
    });
    return;
  }
  return block(EFFECT_BLOCK, fn);
}
function effect(fn) {
  return block(EFFECT_BLOCK, fn);
}
function render(fn, state, flags = 0) {
  return block(RENDER_BLOCK | flags, fn, state);
}
function branch(fn, flags = 0, state = null) {
  return block(BRANCH_BLOCK | flags, fn, state);
}
function root(fn, compat) {
  var target_fn = fn;
  if (compat != null) {
    var unmounts = [];
    for (var key in compat) {
      var api = compat[key];
      unmounts.push(api.createRoot());
    }
    target_fn = () => {
      var component_unmount = fn();
      return () => {
        component_unmount?.();
        for (var unmount of unmounts) {
          unmount?.();
        }
      };
    };
  }
  return block(ROOT_BLOCK, target_fn, { compat }, create_component_ctx());
}
function push_block(block, parent_block) {
  var parent_last = parent_block.last;
  if (parent_last === null) {
    parent_block.last = parent_block.first = block;
  } else {
    parent_last.next = block;
    block.prev = parent_last;
    parent_block.last = block;
  }
}
function block(flags, fn, state = null, co) {
  var block2 = {
    co: co || active_component,
    d: null,
    first: null,
    f: flags,
    fn,
    last: null,
    next: null,
    p: active_block,
    prev: null,
    s: state,
    t: null
  };
  if (active_reaction !== null && (active_reaction.f & DERIVED) !== 0) {
    (active_reaction.blocks ??= []).push(block2);
  }
  if (active_block !== null) {
    push_block(block2, active_block);
  }
  if ((flags & EFFECT_BLOCK) !== 0) {
    schedule_update(block2);
  } else {
    run_block(block2);
    block2.f ^= BLOCK_HAS_RUN;
  }
  return block2;
}
function destroy_block_children(parent, remove_dom = false) {
  var block2 = parent.first;
  parent.first = parent.last = null;
  if ((parent.f & CONTAINS_TEARDOWN) !== 0) {
    while (block2 !== null) {
      var next = block2.next;
      destroy_block(block2, remove_dom);
      block2 = next;
    }
  }
}
function destroy_non_branch_children(parent, remove_dom = false) {
  var block2 = parent.first;
  if ((parent.f & CONTAINS_TEARDOWN) === 0 && parent.first !== null && (parent.first.f & BRANCH_BLOCK) === 0) {
    parent.first = parent.last = null;
  } else {
    while (block2 !== null) {
      var next = block2.next;
      if ((block2.f & BRANCH_BLOCK) === 0) {
        destroy_block(block2, remove_dom);
      }
      block2 = next;
    }
  }
}
function unlink_block(block2) {
  var parent = block2.p;
  var prev = block2.prev;
  var next = block2.next;
  if (prev !== null)
    prev.next = next;
  if (next !== null)
    next.prev = prev;
  if (parent !== null) {
    if (parent.first === block2)
      parent.first = next;
    if (parent.last === block2)
      parent.last = prev;
  }
}
function remove_block_dom(node, end) {
  while (node !== null) {
    var next = node === end ? null : next_sibling(node);
    node.remove();
    node = next;
  }
}
function destroy_block(block2, remove_dom = true) {
  block2.f ^= DESTROYED;
  var removed = false;
  var f = block2.f;
  if (remove_dom && (f & (BRANCH_BLOCK | ROOT_BLOCK)) !== 0 && (f & TRY_BLOCK) === 0 || (f & HEAD_BLOCK) !== 0) {
    var s = block2.s;
    if (s !== null) {
      remove_block_dom(s.start, s.end);
      removed = true;
    }
  }
  destroy_block_children(block2, remove_dom && !removed);
  run_teardown(block2);
  var parent = block2.p;
  if (parent !== null && parent.first !== null) {
    unlink_block(block2);
  }
  block2.fn = block2.s = block2.d = block2.p = block2.d = block2.co = block2.t = null;
}

// node_modules/ripple/src/runtime/internal/client/css.js
function remove_ssr_css() {
  if (!document || typeof requestAnimationFrame !== "function") {
    return;
  }
  remove_styles();
}
function remove_styles() {
  if (true_default) {
    const styles = document.querySelector("style[data-vite-dev-id]");
    if (styles) {
      remove();
    } else {
      requestAnimationFrame(remove_styles);
    }
  } else {
    remove_when_css_loaded(() => requestAnimationFrame(remove));
  }
}
function remove() {
  document.querySelectorAll("style[data-ripple-ssr]").forEach((el) => el.remove());
}
function remove_when_css_loaded(callback) {
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  let remaining = links.length;
  if (remaining === 0) {
    callback();
    return;
  }
  const done = () => {
    remaining--;
    if (remaining === 0) {
      links.forEach((link) => {
        link.removeEventListener("load", onLoad);
        link.removeEventListener("error", onError);
      });
      callback();
    }
  };
  function onLoad() {
    done();
  }
  function onError() {
    done();
  }
  links.forEach((link) => {
    if (link.sheet) {
      done();
    } else {
      link.addEventListener("load", onLoad);
      link.addEventListener("error", onError);
    }
  });
}
// node_modules/ripple/src/runtime/proxy.js
function proxy(value, block2) {
  if (typeof value !== "object" || value === null || TRACKED_ARRAY in value || TRACKED_OBJECT in value) {
    return value;
  }
  const prototype = get_prototype_of(value);
  if (prototype !== object_prototype && prototype !== array_prototype) {
    return value;
  }
  var tracked_elements = new Map;
  var is_proxied_array = is_array(value);
  var tracked_len;
  if (is_proxied_array) {
    tracked_len = tracked(value.length, block2);
    tracked_elements.set("length", tracked_len);
  }
  return new Proxy(value, {
    get(target, prop, receiver) {
      var t = tracked_elements.get(prop);
      var exists = prop in target;
      if (t === undefined && (!exists || get_descriptor(target, prop)?.writable)) {
        t = tracked(exists ? target[prop] : UNINITIALIZED, block2);
        tracked_elements.set(prop, t);
      }
      if (t !== undefined) {
        var v = get(t);
        return v === UNINITIALIZED ? undefined : v;
      }
      var result = Reflect.get(target, prop, receiver);
      if (typeof result === "function") {
        if (methods_returning_arrays.has(prop)) {
          return function(...args) {
            var output = Reflect.apply(result, receiver, args);
            if (Array.isArray(output) && output !== target) {
              return array_proxy({ elements: output, block: block2, use_array: true });
            }
            return output;
          };
        }
        if (is_proxied_array && (prop === "entries" || prop === "values" || prop === "keys")) {
          receiver.length;
        }
      }
      return result;
    },
    set(target, prop, value2, receiver) {
      var t = tracked_elements.get(prop);
      var exists = prop in target;
      if (is_proxied_array && prop === "length" && t !== undefined) {
        for (var i = value2;i < t.__v; i += 1) {
          var other_t = tracked_elements.get(i + "");
          if (other_t !== undefined) {
            set(other_t, UNINITIALIZED);
          } else if (i in target) {
            other_t = tracked(UNINITIALIZED, block2);
            tracked_elements.set(i + "", other_t);
          }
        }
      }
      if (t === undefined) {
        if (!exists || get_descriptor(target, prop)?.writable) {
          t = tracked(undefined, block2);
          set(t, value2);
          tracked_elements.set(prop, t);
        }
      } else {
        exists = t.__v !== UNINITIALIZED;
        set(t, value2);
      }
      var descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
      if (descriptor?.set) {
        descriptor.set.call(receiver, value2);
      }
      if (!exists && is_proxied_array && typeof prop === "string") {
        var n = Number(prop);
        if (Number.isInteger(n) && n >= tracked_len.__v) {
          set(tracked_len, n + 1);
        }
      }
      return true;
    },
    setPrototypeOf() {
      throw new Error(`Cannot set prototype of ${is_proxied_array ? "`TrackedArray`" : "`TrackedObject`"}`);
    },
    deleteProperty(target, prop) {
      var t = tracked_elements.get(prop);
      if (t === undefined) {
        if (prop in target) {
          const t2 = tracked(UNINITIALIZED, block2);
          tracked_elements.set(prop, t2);
        }
      } else {
        set(t, UNINITIALIZED);
      }
      return Reflect.deleteProperty(target, prop);
    },
    has(target, prop) {
      if (is_proxied_array && prop === TRACKED_ARRAY) {
        return true;
      }
      if (prop === TRACKED_OBJECT) {
        return true;
      }
      var t = tracked_elements.get(prop);
      var exists = t !== undefined && t.__v !== UNINITIALIZED || Reflect.has(target, prop);
      if (t !== undefined || !exists || get_descriptor(target, prop)?.writable) {
        if (t === undefined) {
          t = tracked(exists ? target[prop] : UNINITIALIZED, block2);
          tracked_elements.set(prop, t);
        }
        var value2 = get(t);
        if (value2 === UNINITIALIZED) {
          return false;
        }
      }
      return exists;
    },
    defineProperty(_, prop, descriptor) {
      if (!("value" in descriptor) || descriptor.configurable === false || descriptor.enumerable === false || descriptor.writable === false) {
        throw new Error("Only basic property descriptors are supported with value and configurable, enumerable, and writable set to true");
      }
      var t = tracked_elements.get(prop);
      if (t === undefined) {
        t = tracked(descriptor.value, block2);
        tracked_elements.set(prop, t);
      } else {
        set(t, descriptor.value);
      }
      return true;
    },
    ownKeys(target) {
      var own_keys = Reflect.ownKeys(target).filter((key2) => {
        var t2 = tracked_elements.get(key2);
        return t2 === undefined || t2.__v !== UNINITIALIZED;
      });
      for (var [key, t] of tracked_elements) {
        if (t.__v !== UNINITIALIZED && !(key in target)) {
          own_keys.push(key);
        }
      }
      return own_keys;
    },
    getOwnPropertyDescriptor(target, prop) {
      var descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
      if (descriptor && "value" in descriptor) {
        var t = tracked_elements.get(prop);
        if (t)
          descriptor.value = get(t);
      } else if (descriptor === undefined) {
        var t = tracked_elements.get(prop);
        var value2 = t?.__v;
        if (t !== undefined && value2 !== UNINITIALIZED) {
          return {
            enumerable: true,
            configurable: true,
            value: value2,
            writable: true
          };
        }
      }
      return descriptor;
    }
  });
}
function array_proxy({ elements, block: block2, from_static = false, use_array = false }) {
  var arr;
  var first;
  if (from_static && (first = get_first_if_length(elements)) !== undefined) {
    arr = new Array;
    arr[0] = first;
  } else if (use_array) {
    arr = elements;
  } else {
    arr = new Array(...elements);
  }
  return proxy(arr, block2);
}
var methods_returning_arrays = new Set([
  "concat",
  "filter",
  "flat",
  "flatMap",
  "map",
  "slice",
  "splice",
  "toReversed",
  "toSorted",
  "toSpliced",
  "with"
]);
function get_first_if_length(array) {
  var first = array[0];
  if (array.length === 1 && 0 in array && Number.isInteger(first) && first >= 0 && first <= MAX_ARRAY_LENGTH) {
    return first;
  }
}

// node_modules/ripple/src/runtime/array.js
function TrackedArray(...elements) {
  if (!new.target) {
    throw new Error("TrackedArray must be called with 'new'");
  }
  var block2 = safe_scope();
  return array_proxy({ elements, block: block2 });
}
TrackedArray.from = function(arrayLike, mapFn, thisArg) {
  var block2 = safe_scope();
  var elements = mapFn ? Array.from(arrayLike, mapFn, thisArg) : Array.from(arrayLike);
  return array_proxy({ elements, block: block2, from_static: true });
};
TrackedArray.of = function(...items) {
  var block2 = safe_scope();
  var elements = Array.of(...items);
  return array_proxy({ elements, block: block2, from_static: true });
};
TrackedArray.fromAsync = async function(arrayLike, mapFn, thisArg) {
  var block2 = safe_scope();
  var elements = mapFn ? await Array.fromAsync(arrayLike, mapFn, thisArg) : await Array.fromAsync(arrayLike);
  return array_proxy({ elements, block: block2, from_static: true });
};
// node_modules/ripple/src/runtime/set.js
var introspect_methods = ["entries", "forEach", "keys", "values", Symbol.iterator];
var compare_other_methods = ["isDisjointFrom", "isSubsetOf", "isSupersetOf"];
var new_other_methods = ["difference", "intersection", "symmetricDifference", "union"];
var init = false;

class TrackedSet extends Set {
  #tracked_size;
  #tracked_items = new Map;
  #block;
  constructor(iterable) {
    super();
    var block2 = this.#block = safe_scope();
    if (iterable) {
      for (var item of iterable) {
        super.add(item);
        this.#tracked_items.set(item, tracked(0, block2));
      }
    }
    this.#tracked_size = tracked(super.size, block2);
    if (!init) {
      init = true;
      this.#init();
    }
  }
  #init() {
    var proto = TrackedSet.prototype;
    var set_proto = Set.prototype;
    for (const method of introspect_methods) {
      if (!(method in set_proto)) {
        continue;
      }
      proto[method] = function(...v) {
        this.size;
        return set_proto[method].apply(this, v);
      };
    }
    for (const method of compare_other_methods) {
      if (!(method in set_proto)) {
        continue;
      }
      proto[method] = function(other, ...v) {
        this.size;
        if (other instanceof TrackedSet) {
          other.size;
        }
        return set_proto[method].apply(this, [other, ...v]);
      };
    }
    for (const method of new_other_methods) {
      if (!(method in set_proto)) {
        continue;
      }
      proto[method] = function(other, ...v) {
        this.size;
        if (other instanceof TrackedSet) {
          other.size;
        }
        return new TrackedSet(set_proto[method].apply(this, [other, ...v]));
      };
    }
  }
  add(value) {
    var block2 = this.#block;
    if (!super.has(value)) {
      super.add(value);
      this.#tracked_items.set(value, tracked(0, block2));
      set(this.#tracked_size, super.size);
    }
    return this;
  }
  delete(value) {
    var block2 = this.#block;
    if (!super.delete(value)) {
      return false;
    }
    var t = this.#tracked_items.get(value);
    if (t) {
      increment(t);
    }
    this.#tracked_items.delete(value);
    set(this.#tracked_size, super.size);
    return true;
  }
  has(value) {
    var has = super.has(value);
    var tracked_items = this.#tracked_items;
    var t = tracked_items.get(value);
    if (t === undefined) {
      this.size;
    } else {
      get(t);
    }
    return has;
  }
  clear() {
    var block2 = this.#block;
    if (super.size === 0) {
      return;
    }
    for (var [_, t] of this.#tracked_items) {
      increment(t);
    }
    super.clear();
    this.#tracked_items.clear();
    set(this.#tracked_size, 0);
  }
  get size() {
    return get(this.#tracked_size);
  }
  toJSON() {
    this.size;
    return [...this];
  }
}
// node_modules/ripple/src/runtime/map.js
var introspect_methods2 = ["entries", "forEach", "values", Symbol.iterator];
var init2 = false;

class TrackedMap extends Map {
  #tracked_size;
  #tracked_items = new Map;
  #block;
  constructor(iterable) {
    super();
    var block2 = this.#block = safe_scope();
    if (iterable) {
      for (var [key, value] of iterable) {
        super.set(key, value);
        this.#tracked_items.set(key, tracked(0, block2));
      }
    }
    this.#tracked_size = tracked(super.size, block2);
    if (!init2) {
      init2 = true;
      this.#init();
    }
  }
  #init() {
    var proto = TrackedMap.prototype;
    var map_proto = Map.prototype;
    for (const method of introspect_methods2) {
      proto[method] = function(...v) {
        this.size;
        this.#read_all();
        return map_proto[method].apply(this, v);
      };
    }
  }
  get(key) {
    var tracked_items = this.#tracked_items;
    var t = tracked_items.get(key);
    if (t === undefined) {
      this.size;
    } else {
      get(t);
    }
    return super.get(key);
  }
  has(key) {
    var has = super.has(key);
    var tracked_items = this.#tracked_items;
    var t = tracked_items.get(key);
    if (t === undefined) {
      this.size;
    } else {
      get(t);
    }
    return has;
  }
  set(key, value) {
    var block2 = this.#block;
    var tracked_items = this.#tracked_items;
    var t = tracked_items.get(key);
    var prev_res = super.get(key);
    super.set(key, value);
    if (!t) {
      tracked_items.set(key, tracked(0, block2));
      set(this.#tracked_size, super.size);
    } else if (prev_res !== value) {
      increment(t);
    }
    return this;
  }
  delete(key) {
    var block2 = this.#block;
    var tracked_items = this.#tracked_items;
    var t = tracked_items.get(key);
    var result = super.delete(key);
    if (t) {
      increment(t);
      tracked_items.delete(key);
      set(this.#tracked_size, super.size);
    }
    return result;
  }
  clear() {
    var block2 = this.#block;
    if (super.size === 0) {
      return;
    }
    for (var [_, t] of this.#tracked_items) {
      increment(t);
    }
    super.clear();
    this.#tracked_items.clear();
    set(this.#tracked_size, 0);
  }
  keys() {
    this.size;
    return super.keys();
  }
  #read_all() {
    for (const [, t] of this.#tracked_items) {
      get(t);
    }
  }
  get size() {
    return get(this.#tracked_size);
  }
  toJSON() {
    this.size;
    this.#read_all();
    return [...this];
  }
}
// node_modules/ripple/src/runtime/date.js
var init3 = false;

class TrackedDate extends Date {
  #time;
  #deriveds = new Map;
  #block;
  constructor(...params) {
    super(...params);
    var block2 = this.#block = safe_scope();
    this.#time = tracked(super.getTime(), block2);
    if (!init3)
      this.#init();
  }
  #init() {
    init3 = true;
    var proto = TrackedDate.prototype;
    var date_proto = Date.prototype;
    var methods = Object.getOwnPropertyNames(date_proto);
    for (const method of methods) {
      if (method.startsWith("get") || method.startsWith("to") || method === "valueOf") {
        proto[method] = function(...args) {
          if (args.length > 0) {
            get(this.#time);
            return date_proto[method].apply(this, args);
          }
          var d = this.#deriveds.get(method);
          if (d === undefined) {
            d = derived(() => {
              get(this.#time);
              return date_proto[method].apply(this, args);
            }, this.#block);
            this.#deriveds.set(method, d);
          }
          return get(d);
        };
      }
      if (method.startsWith("set")) {
        proto[method] = function(...args) {
          var result = date_proto[method].apply(this, args);
          set(this.#time, date_proto.getTime.call(this));
          return result;
        };
      }
    }
  }
}
// node_modules/ripple/src/runtime/url-search-params.js
var REPLACE = Symbol();

class TrackedURLSearchParams extends URLSearchParams {
  #block = safe_scope();
  #version = tracked(0, this.#block);
  #url = get_current_url();
  #updating = false;
  #update_url() {
    if (!this.#url || this.#updating)
      return;
    this.#updating = true;
    const search = this.toString();
    this.#url.search = search && `?${search}`;
    this.#updating = false;
  }
  [REPLACE](params) {
    if (this.#updating)
      return;
    this.#updating = true;
    for (const key of [...super.keys()]) {
      super.delete(key);
    }
    for (const [key, value] of params) {
      super.append(key, value);
    }
    increment(this.#version);
    this.#updating = false;
  }
  append(name, value) {
    super.append(name, value);
    this.#update_url();
    increment(this.#version);
  }
  delete(name, value) {
    var has_value = super.has(name, value);
    super.delete(name, value);
    if (has_value) {
      this.#update_url();
      increment(this.#version);
    }
  }
  get(name) {
    get(this.#version);
    return super.get(name);
  }
  getAll(name) {
    get(this.#version);
    return super.getAll(name);
  }
  has(name, value) {
    get(this.#version);
    return super.has(name, value);
  }
  keys() {
    get(this.#version);
    return super.keys();
  }
  set(name, value) {
    var previous = super.getAll(name).join("");
    super.set(name, value);
    if (previous !== super.getAll(name).join("")) {
      this.#update_url();
      increment(this.#version);
    }
  }
  sort() {
    super.sort();
    this.#update_url();
    increment(this.#version);
  }
  toString() {
    get(this.#version);
    return super.toString();
  }
  values() {
    get(this.#version);
    return super.values();
  }
  entries() {
    get(this.#version);
    return super.entries();
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  get size() {
    get(this.#version);
    return super.size;
  }
}

// node_modules/ripple/src/runtime/url.js
var current_url = null;
function get_current_url() {
  return current_url;
}

class TrackedURL extends URL {
  #block = safe_scope();
  #protocol = tracked(super.protocol, this.#block);
  #username = tracked(super.username, this.#block);
  #password = tracked(super.password, this.#block);
  #hostname = tracked(super.hostname, this.#block);
  #port = tracked(super.port, this.#block);
  #pathname = tracked(super.pathname, this.#block);
  #hash = tracked(super.hash, this.#block);
  #search = tracked(super.search, this.#block);
  #searchParams;
  constructor(url, base) {
    url = new URL(url, base);
    super(url);
    current_url = this;
    this.#searchParams = new TrackedURLSearchParams(url.searchParams);
    current_url = null;
  }
  get hash() {
    return get(this.#hash);
  }
  set hash(value) {
    super.hash = value;
    set(this.#hash, super.hash);
  }
  get host() {
    get(this.#hostname);
    get(this.#port);
    return super.host;
  }
  set host(value) {
    super.host = value;
    set(this.#hostname, super.hostname);
    set(this.#port, super.port);
  }
  get hostname() {
    return get(this.#hostname);
  }
  set hostname(value) {
    super.hostname = value;
    set(this.#hostname, super.hostname);
  }
  get href() {
    get(this.#protocol);
    get(this.#username);
    get(this.#password);
    get(this.#hostname);
    get(this.#port);
    get(this.#pathname);
    get(this.#hash);
    get(this.#search);
    return super.href;
  }
  set href(value) {
    super.href = value;
    set(this.#protocol, super.protocol);
    set(this.#username, super.username);
    set(this.#password, super.password);
    set(this.#hostname, super.hostname);
    set(this.#port, super.port);
    set(this.#pathname, super.pathname);
    set(this.#hash, super.hash);
    set(this.#search, super.search);
    this.#searchParams[REPLACE](super.searchParams);
  }
  get password() {
    return get(this.#password);
  }
  set password(value) {
    super.password = value;
    set(this.#password, super.password);
  }
  get pathname() {
    return get(this.#pathname);
  }
  set pathname(value) {
    super.pathname = value;
    set(this.#pathname, super.pathname);
  }
  get port() {
    return get(this.#port);
  }
  set port(value) {
    super.port = value;
    set(this.#port, super.port);
  }
  get protocol() {
    return get(this.#protocol);
  }
  set protocol(value) {
    super.protocol = value;
    set(this.#protocol, super.protocol);
  }
  get search() {
    return get(this.#search);
  }
  set search(value) {
    super.search = value;
    set(this.#search, value);
    this.#searchParams[REPLACE](super.searchParams);
  }
  get username() {
    return get(this.#username);
  }
  set username(value) {
    super.username = value;
    set(this.#username, super.username);
  }
  get origin() {
    get(this.#protocol);
    get(this.#hostname);
    get(this.#port);
    return super.origin;
  }
  get searchParams() {
    return this.#searchParams;
  }
  toString() {
    return this.href;
  }
  toJSON() {
    return this.href;
  }
}
// node_modules/ripple/src/constants.js
var TEMPLATE_FRAGMENT = 1;
var TEMPLATE_USE_IMPORT_NODE = 1 << 1;
var IS_CONTROLLED = 1 << 2;
var IS_INDEXED = 1 << 3;
var TEMPLATE_SVG_NAMESPACE = 1 << 5;
var TEMPLATE_MATHML_NAMESPACE = 1 << 6;

// node_modules/ripple/src/runtime/internal/client/for.js
function create_item(anchor, value, index, render_fn, is_indexed, is_keyed) {
  var b = branch(() => {
    var tracked_index;
    var tracked_value = value;
    if (is_indexed || is_keyed) {
      var block2 = active_block;
      if (block2.s === null) {
        if (is_indexed) {
          tracked_index = tracked(index, block2);
        }
        if (is_keyed) {
          tracked_value = tracked(value, block2);
        }
        block2.s = {
          start: null,
          end: null,
          i: tracked_index,
          v: tracked_value
        };
      } else {
        if (is_indexed) {
          tracked_index = block2.s.i;
        }
        if (is_keyed) {
          tracked_index = block2.s.v;
        }
      }
      render_fn(anchor, tracked_value, tracked_index);
    } else {
      render_fn(anchor, tracked_value);
    }
  });
  return b;
}
function move(block2, anchor) {
  var node = block2.s.start;
  var end = block2.s.end;
  if (node === end) {
    anchor.before(node);
    return;
  }
  while (node !== null) {
    var next_node = next_sibling(node);
    anchor.before(node);
    node = next_node;
    if (node === end) {
      anchor.before(end);
      break;
    }
  }
}
function collection_to_array(collection) {
  var array = is_array(collection) ? collection : collection == null ? [] : array_from(collection);
  if (TRACKED_ARRAY in array) {
    array = array_from(array);
  }
  return array;
}
function for_block(node, get_collection, render_fn, flags) {
  var is_controlled = (flags & IS_CONTROLLED) !== 0;
  var is_indexed = (flags & IS_INDEXED) !== 0;
  var anchor = node;
  if (is_controlled) {
    anchor = node.appendChild(create_text());
  }
  render(() => {
    var block2 = active_block;
    var collection = get_collection();
    var array = collection_to_array(collection);
    untrack(() => {
      reconcile_by_ref(anchor, block2, array, render_fn, is_controlled, is_indexed);
    });
  }, null, FOR_BLOCK);
}
function reconcile_fast_clear(anchor, block2, array) {
  var state = block2.s;
  var parent_node = anchor.parentNode;
  parent_node.textContent = "";
  destroy_block_children(block2);
  parent_node.append(anchor);
  state.array = array;
  state.blocks = [];
}
function update_index(block2, index) {
  set(block2.s.i, index);
}
function reconcile_by_ref(anchor, block2, b, render_fn, is_controlled, is_indexed) {
  var state = block2.s;
  var a_start = 0;
  var b_start = 0;
  var a_left = 0;
  var b_left = 0;
  var sources = new Int32Array(0);
  var moved = false;
  var pos = 0;
  var patched = 0;
  var i = 0;
  if (state === null) {
    state = block2.s = {
      array: [],
      blocks: [],
      keys: null
    };
  }
  var a = state.array;
  var a_length = a.length;
  var b_length = b.length;
  var j = 0;
  if (is_controlled && b_length === 0) {
    if (a_length > 0) {
      reconcile_fast_clear(anchor, block2, b);
    }
    return;
  }
  var b_blocks = Array(b_length);
  if (a_length === 0) {
    for (;j < b_length; j++) {
      b_blocks[j] = create_item(anchor, b[j], j, render_fn, is_indexed, false);
    }
    state.array = b;
    state.blocks = b_blocks;
    return;
  }
  var a_blocks = state.blocks;
  var a_val = a[j];
  var b_val = b[j];
  var a_end = a_length - 1;
  var b_end = b_length - 1;
  var b_block;
  outer: {
    while (a_val === b_val) {
      a[j] = b_val;
      b_block = b_blocks[j] = a_blocks[j];
      if (is_indexed) {
        update_index(b_block, j);
      }
      ++j;
      if (j > a_end || j > b_end) {
        break outer;
      }
      a_val = a[j];
      b_val = b[j];
    }
    a_val = a[a_end];
    b_val = b[b_end];
    while (a_val === b_val) {
      a[a_end] = b_val;
      b_block = b_blocks[b_end] = a_blocks[a_end];
      if (is_indexed) {
        update_index(b_block, b_end);
      }
      a_end--;
      b_end--;
      if (j > a_end || j > b_end) {
        break outer;
      }
      a_val = a[a_end];
      b_val = b[b_end];
    }
  }
  var fast_path_removal = false;
  if (j > a_end) {
    if (j <= b_end) {
      while (j <= b_end) {
        b_val = b[j];
        var target = j >= a_length ? anchor : a_blocks[j].s.start;
        b_blocks[j] = create_item(target, b_val, j, render_fn, is_indexed, false);
        j++;
      }
    }
  } else if (j > b_end) {
    while (j <= a_end) {
      destroy_block(a_blocks[j++]);
    }
  } else {
    a_start = j;
    b_start = j;
    a_left = a_end - j + 1;
    b_left = b_end - j + 1;
    sources = new Int32Array(b_left + 1);
    moved = false;
    pos = 0;
    patched = 0;
    i = 0;
    fast_path_removal = is_controlled && a_left === a_length;
    if (b_length < 4 || (a_left | b_left) < 32) {
      for (i = a_start;i <= a_end; ++i) {
        a_val = a[i];
        if (patched < b_left) {
          for (j = b_start;j <= b_end; j++) {
            b_val = b[j];
            if (a_val === b_val) {
              sources[j - b_start] = i + 1;
              if (fast_path_removal) {
                fast_path_removal = false;
                while (a_start < i) {
                  destroy_block(a_blocks[a_start++]);
                }
              }
              if (pos > j) {
                moved = true;
              } else {
                pos = j;
              }
              b_block = b_blocks[j] = a_blocks[i];
              if (is_indexed) {
                update_index(b_block, j);
              }
              ++patched;
              break;
            }
          }
          if (!fast_path_removal && j > b_end) {
            destroy_block(a_blocks[i]);
          }
        } else if (!fast_path_removal) {
          destroy_block(a_blocks[i]);
        }
      }
    } else {
      var map = new Map;
      for (i = b_start;i <= b_end; ++i) {
        map.set(b[i], i);
      }
      for (i = a_start;i <= a_end; ++i) {
        a_val = a[i];
        if (patched < b_left) {
          j = map.get(a_val);
          if (j !== undefined) {
            if (fast_path_removal) {
              fast_path_removal = false;
              while (i > a_start) {
                destroy_block(a[a_start++]);
              }
            }
            sources[j - b_start] = i + 1;
            if (pos > j) {
              moved = true;
            } else {
              pos = j;
            }
            block2 = b_blocks[j] = a_blocks[i];
            if (is_indexed) {
              update_index(block2, j);
            }
            ++patched;
          } else if (!fast_path_removal) {
            destroy_block(a_blocks[i]);
          }
        } else if (!fast_path_removal) {
          destroy_block(a_blocks[i]);
        }
      }
    }
  }
  if (fast_path_removal) {
    reconcile_fast_clear(anchor, block2, []);
    reconcile_by_ref(anchor, block2, b, render_fn, is_controlled, is_indexed);
    return;
  } else if (moved) {
    var next_pos = 0;
    var seq = lis_algorithm(sources);
    j = seq.length - 1;
    for (i = b_left - 1;i >= 0; i--) {
      if (sources[i] === 0) {
        pos = i + b_start;
        b_val = b[pos];
        next_pos = pos + 1;
        var target = next_pos < b_length ? b_blocks[next_pos].s.start : anchor;
        b_blocks[pos] = create_item(target, b_val, pos, render_fn, is_indexed, false);
      } else if (j < 0 || i !== seq[j]) {
        pos = i + b_start;
        b_val = b[pos];
        next_pos = pos + 1;
        var target = next_pos < b_length ? b_blocks[next_pos].s.start : anchor;
        move(b_blocks[pos], target);
      } else {
        j--;
      }
    }
  } else if (patched !== b_left) {
    for (i = b_left - 1;i >= 0; i--) {
      if (sources[i] === 0) {
        pos = i + b_start;
        b_val = b[pos];
        next_pos = pos + 1;
        var target = next_pos < b_length ? b_blocks[next_pos].s.start : anchor;
        b_blocks[pos] = create_item(target, b_val, pos, render_fn, is_indexed, false);
      }
    }
  }
  state.array = b;
  state.blocks = b_blocks;
}
var result;
var p;
var max_len = 0;
function lis_algorithm(arr) {
  let arrI = 0;
  let i = 0;
  let j = 0;
  let k = 0;
  let u = 0;
  let v = 0;
  let c = 0;
  var len = arr.length;
  if (len > max_len) {
    max_len = len;
    result = new Int32Array(len);
    p = new Int32Array(len);
  }
  for (;i < len; ++i) {
    arrI = arr[i];
    if (arrI !== 0) {
      j = result[k];
      if (arr[j] < arrI) {
        p[i] = j;
        result[++k] = i;
        continue;
      }
      u = 0;
      v = k;
      while (u < v) {
        c = u + v >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = k + 1;
  var seq = new Int32Array(u);
  v = result[u - 1];
  while (u-- > 0) {
    seq[u] = v;
    v = p[v];
    result[u] = 0;
  }
  return seq;
}
// node_modules/ripple/src/runtime/internal/client/template.js
function assign_nodes(start, end) {
  var block2 = active_block;
  var s = block2.s;
  if (s === null) {
    block2.s = {
      start,
      end
    };
  } else if (s.start === null) {
    s.start = start;
    s.end = end;
  }
}
function create_fragment_from_html(html, use_svg_namespace = false, use_mathml_namespace = false) {
  if (use_svg_namespace) {
    return from_namespace(html, "svg");
  }
  if (use_mathml_namespace) {
    return from_namespace(html, "math");
  }
  var elem = document.createElement("template");
  elem.innerHTML = html;
  return elem.content;
}
function template(content, flags) {
  var is_fragment = (flags & TEMPLATE_FRAGMENT) !== 0;
  var use_import_node = (flags & TEMPLATE_USE_IMPORT_NODE) !== 0;
  var use_svg_namespace = (flags & TEMPLATE_SVG_NAMESPACE) !== 0;
  var use_mathml_namespace = (flags & TEMPLATE_MATHML_NAMESPACE) !== 0;
  var node;
  var is_comment = content === "<!>";
  var has_start = !is_comment && !content.startsWith("<!>");
  return () => {
    var svg = !is_comment && (use_svg_namespace || active_namespace === "svg");
    var mathml = !is_comment && (use_mathml_namespace || active_namespace === "mathml");
    if (node === undefined) {
      node = create_fragment_from_html(has_start ? content : "<!>" + content, svg, mathml);
      if (!is_fragment)
        node = first_child(node);
    }
    var clone = use_import_node || is_firefox ? document.importNode(node, true) : node.cloneNode(true);
    if (is_fragment) {
      var start = first_child(clone);
      var end = clone.lastChild;
      assign_nodes(start, end);
    } else {
      assign_nodes(clone, clone);
    }
    return clone;
  };
}
function append(anchor, dom) {
  anchor.before(dom);
}
function from_namespace(content, ns = "svg") {
  var wrapped = `<${ns}>${content}</${ns}>`;
  var elem = document.createElement("template");
  elem.innerHTML = wrapped;
  var fragment = elem.content;
  var root2 = first_child(fragment);
  var result2 = document.createDocumentFragment();
  var first;
  while (first = first_child(root2)) {
    result2.appendChild(first);
  }
  return result2;
}
// node_modules/ripple/src/runtime/media-query.js
var non_parenthesized_keywords = new Set(["all", "print", "screen", "and", "or", "not", "only"]);
// node_modules/ripple/src/runtime/internal/client/bindings.js
class ResizeObserverSingleton {
  #listeners = new WeakMap;
  #observer;
  #options;
  static entries = new WeakMap;
  constructor(options) {
    this.#options = options;
  }
  observe(element, listener) {
    var listeners = this.#listeners.get(element) || new Set;
    listeners.add(listener);
    this.#listeners.set(element, listeners);
    this.#getObserver().observe(element, this.#options);
    return () => {
      var listeners2 = this.#listeners.get(element);
      listeners2.delete(listener);
      if (listeners2.size === 0) {
        this.#listeners.delete(element);
        this.#observer.unobserve(element);
      }
    };
  }
  #getObserver() {
    return this.#observer ?? (this.#observer = new ResizeObserver((entries) => {
      for (var entry of entries) {
        ResizeObserverSingleton.entries.set(entry.target, entry);
        for (var listener of this.#listeners.get(entry.target) || []) {
          listener(entry);
        }
      }
    }));
  }
}

// node_modules/ripple/src/runtime/index-client.js
function mount(component, options) {
  init_operations();
  remove_ssr_css();
  const props = options.props || {};
  const target = options.target;
  const anchor = create_anchor();
  if (target.firstChild) {
    target.textContent = "";
  }
  target.append(anchor);
  const cleanup_events = handle_root_events(target);
  const _root = root(() => {
    component(anchor, props, active_block);
  }, options.compat);
  return () => {
    cleanup_events();
    destroy_block(_root);
  };
}

// src/lib/game.ts
var wrapIndex = (size, value) => (value + size) % size;
var getNeighbours = (grid, position) => {
  const size = grid.length;
  let count = 0;
  for (let yOffset = -1;yOffset <= 1; yOffset += 1) {
    for (let xOffset = -1;xOffset <= 1; xOffset += 1) {
      if (yOffset === 0 && xOffset === 0) {
        continue;
      }
      const y = wrapIndex(size, position.y + yOffset);
      const x = wrapIndex(size, position.x + xOffset);
      if (grid[y]?.[x]) {
        count += 1;
      }
    }
  }
  return count;
};
var willLive = (isAlive, neighbours) => isAlive ? neighbours >= 2 && neighbours <= 3 : neighbours === 3;
var nextState = (grid) => grid.map((row, y) => row.map((cell, x) => willLive(cell, getNeighbours(grid, { y, x }))));

// src/lib/utils.ts
var createGrid = (size) => Array.from({ length: size }, () => Array.from({ length: size }, () => false));
var createRandomGrid = (size, density = 0.22) => createGrid(size).map((row) => row.map(() => Math.random() < density));
var toggleCell = (grid, point) => grid.map((row, y) => y === point.y ? row.map((cell, x) => x === point.x ? !cell : cell) : row.slice());

// src/App.compiled.js
var root2 = template(`<div class="min-h-screen px-4 pb-16 pt-8 sm:px-8 lg:px-12"><header class="mx-auto mb-8 max-w-5xl"><div class="inline-block border-3 border-black bg-[var(--neo-blue)] px-4 py-2 neo-shadow mb-4"><p class="text-xs font-bold uppercase tracking-widest">Ripple + Cellular Automata</p></div><h1 class="font-['Syne'] text-5xl font-extrabold uppercase tracking-tight sm:text-6xl lg:text-7xl"> <br><span class="inline-block border-3 border-black bg-[var(--neo-pink)] px-3 -rotate-1">Game of Life</span></h1><p class="mt-4 max-w-xl text-base font-medium leading-relaxed">Seed a few cells, press play, and watch patterns ripple across the field.</p></header><main class="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[300px_minmax(0,1fr)]"><section><div class="flex items-baseline justify-between border-b-3 border-black pb-4 mb-4"><h2 class="font-['Syne'] text-xl font-bold uppercase">Controls</h2><span class="border-2 border-black bg-white px-2 py-1 text-xs font-bold"> </span></div><div class="grid grid-cols-3 gap-3 mb-6"><div><span class="block text-[10px] font-bold uppercase tracking-wider text-black/60">Gen</span><span class="block text-2xl font-bold tabular-nums"> </span></div><div><span class="block text-[10px] font-bold uppercase tracking-wider text-black/60">Alive</span><span class="block text-2xl font-bold tabular-nums"> </span></div><div><span class="block text-[10px] font-bold uppercase tracking-wider text-black/60">FPS</span><span class="block text-2xl font-bold tabular-nums"> </span></div></div><div class="grid gap-3"><button> </button><div class="grid grid-cols-2 gap-3"><button>Step</button><button>Random</button></div><button>Clear</button></div><div class="mt-6 border-3 border-black bg-white p-3 neo-shadow"><p class="text-xs font-medium"><span class="font-bold">TIP:</span> </p></div></section><section class="border-3 border-black bg-white p-4 neo-shadow-lg"><div class="flex flex-wrap items-center justify-between gap-3 border-b-3 border-black pb-3 mb-4"><h2 class="font-['Syne'] text-xl font-bold uppercase">Habitat</h2><div class="flex items-center gap-4 text-xs font-bold uppercase"><span class="flex items-center gap-2"><span class="h-4 w-4 border-2 border-black bg-[var(--neo-pink)]"></span> </span><span class="flex items-center gap-2"><span class="h-4 w-4 border-2 border-black bg-white"></span> </span></div></div><div class="grid touch-none gap-0 border-3 border-black bg-black p-[1px] neo-inset"></div></section></main><footer class="mx-auto mt-8 max-w-5xl"><div class="inline-block border-3 border-black bg-black text-white px-4 py-2 neo-shadow"><p class="text-xs font-bold uppercase tracking-wider">Built with Ripple + Bun</p></div></footer></div>`, 1);
var root_1 = template(`<!>`, 1);
var root_2 = template(`<button></button>`, 0);
var DEFAULT_SIZE = 28;
var DENSITY = 0.24;
function App(__anchor, _, __block) {
  push_component();
  var fragment = root2();
  var div_2 = child_frag(fragment);
  var header_1 = first_child(div_2);
  var div_1 = first_child(header_1);
  var h1_1 = next_sibling(div_1);
  var text = first_child(h1_1);
  var main_1 = next_sibling(header_1);
  var section_1 = first_child(main_1);
  var div_3 = first_child(section_1);
  var h2_1 = first_child(div_3);
  var span_1 = next_sibling(h2_1);
  var text_1 = first_child(span_1);
  var div_5 = next_sibling(div_3);
  var div_4 = first_child(div_5);
  var span_3 = first_child(div_4);
  var span_2 = next_sibling(span_3);
  var text_2 = first_child(span_2);
  var div_6 = next_sibling(div_4);
  var span_5 = first_child(div_6);
  var span_4 = next_sibling(span_5);
  var text_3 = first_child(span_4);
  var div_7 = next_sibling(div_6);
  var span_7 = first_child(div_7);
  var span_6 = next_sibling(span_7);
  var text_4 = first_child(span_6);
  var div_8 = next_sibling(div_5);
  var button_1 = first_child(div_8);
  var text_5 = first_child(button_1);
  var div_9 = next_sibling(button_1);
  var button_2 = first_child(div_9);
  var button_3 = next_sibling(button_2);
  var button_4 = next_sibling(div_9);
  var div_10 = next_sibling(div_8);
  var p_1 = first_child(div_10);
  var span_8 = first_child(p_1);
  var text_6 = next_sibling(span_8);
  var section_2 = next_sibling(section_1);
  var div_12 = first_child(section_2);
  var h2_2 = first_child(div_12);
  var div_11 = next_sibling(h2_2);
  var span_10 = first_child(div_11);
  var span_9 = first_child(span_10);
  var text_7 = next_sibling(span_9);
  var span_12 = next_sibling(span_10);
  var span_11 = first_child(span_12);
  var text_8 = next_sibling(span_11);
  var div_13 = next_sibling(div_12);
  const size = DEFAULT_SIZE;
  let grid = track(with_scope(__block, () => createRandomGrid(size, DENSITY)), undefined, undefined, __block);
  let running = track(false, undefined, undefined, __block);
  let generation = track(0, undefined, undefined, __block);
  let fps = track(0, undefined, undefined, __block);
  let living = track(() => with_scope(__block, () => get(grid).reduce((total, row) => total + with_scope(__block, () => row.filter(Boolean)).length, 0)), undefined, undefined, __block);
  const buttonBase = "inline-flex w-full items-center justify-center border-3 border-black px-4 py-3 text-sm font-bold uppercase tracking-wide neo-shadow-hover cursor-pointer";
  const panelSurface = "border-3 border-black bg-[var(--neo-yellow)] p-6 neo-shadow-lg";
  const statSurface = "border-3 border-black bg-white p-4 neo-shadow";
  const cellBase = "aspect-square w-full border border-black bg-white transition-colors duration-75";
  const cellAlive = "bg-[var(--neo-pink)] border-black";
  const stepForward = () => {
    set(grid, with_scope(__block, () => nextState(get(grid))));
    set(generation, get(generation) + 1);
  };
  const toggleRunning = () => {
    set(running, !get(running));
  };
  const handleClear = () => {
    set(running, false);
    set(generation, 0);
    set(grid, with_scope(__block, () => createGrid(size)));
  };
  const handleRandom = () => {
    set(running, false);
    set(generation, 0);
    set(grid, with_scope(__block, () => createRandomGrid(size, DENSITY)));
  };
  with_scope(__block, () => user_effect(() => {
    if (!get(running)) {
      set(fps, 0);
      return;
    }
    let rafId = 0;
    let frames = 0;
    let fpsStamp = with_scope(__block, () => performance.now());
    const loop = (now) => {
      frames += 1;
      if (now - fpsStamp >= 500) {
        set(fps, with_scope(__block, () => Math.round(frames * 1000 / (now - fpsStamp))));
        fpsStamp = now;
        frames = 0;
      }
      set(grid, with_scope(__block, () => nextState(get(grid))));
      set(generation, get(generation) + 1);
      rafId = with_scope(__block, () => requestAnimationFrame(loop));
    };
    rafId = with_scope(__block, () => requestAnimationFrame(loop));
    return () => with_scope(__block, () => cancelAnimationFrame(rafId));
  }));
  {
    {
      set_class(section_1, panelSurface, undefined, true);
      {
        {
          set_class(div_4, statSurface, undefined, true);
          set_class(div_6, statSurface, undefined, true);
          set_class(div_7, statSurface, undefined, true);
        }
        {
          button_1.__click = toggleRunning;
          {
            button_2.__click = stepForward;
            set_class(button_2, [
              buttonBase,
              "bg-[var(--neo-purple)] text-white hover:bg-purple-400"
            ], undefined, true);
            button_3.__click = handleRandom;
            set_class(button_3, [buttonBase, "bg-[var(--neo-blue)] hover:bg-teal-300"], undefined, true);
          }
          button_4.__click = handleClear;
          set_class(button_4, [buttonBase, "bg-white hover:bg-gray-100"], undefined, true);
        }
      }
      {
        set_style(div_13, { gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }, undefined);
        {
          for_block(div_13, () => get(grid), (__anchor2, row, y) => {
            var fragment_1 = root_1();
            var node = child_frag(fragment_1);
            for_block(node, () => row, (__anchor3, cell, x) => {
              var button_5 = root_2();
              button_5.__pointerdown = () => {
                set(grid, with_scope(__block, () => toggleCell(get(grid), { y: get(y), x: get(x) })));
              };
              event("PointerEnter", button_5, (event2) => {
                if (event2.buttons === 1) {
                  set(grid, with_scope(__block, () => toggleCell(get(grid), { y: get(y), x: get(x) })));
                }
              });
              set_class(button_5, [cellBase, cell && cellAlive], undefined, true);
              render(() => {
                set_attribute(button_5, "aria-label", `Cell ${get(y) + 1}, ${get(x) + 1}`);
              });
              append(__anchor3, button_5);
            }, 8);
            append(__anchor2, fragment_1);
          }, 12);
        }
      }
    }
  }
  render((__prev) => {
    var __a = "Conway's";
    if (__prev.a !== __a) {
      set_text(text, __prev.a = __a);
    }
    var __b = size + with_scope(__block, () => String("x" + String(size)));
    if (__prev.b !== __b) {
      set_text(text_1, __prev.b = __b);
    }
    var __c = get(generation);
    if (__prev.c !== __c) {
      set_text(text_2, __prev.c = __c);
    }
    var __d = get(living);
    if (__prev.d !== __d) {
      set_text(text_3, __prev.d = __d);
    }
    var __e = get(fps);
    if (__prev.e !== __e) {
      set_text(text_4, __prev.e = __e);
    }
    var __f = get(running) ? "Pause" : "Play";
    if (__prev.f !== __f) {
      set_text(text_5, __prev.f = __f);
    }
    var __g = [
      buttonBase,
      get(running) ? "bg-[var(--neo-orange)] hover:bg-orange-400" : "bg-[var(--neo-green)] hover:bg-lime-400"
    ];
    if (__prev.g !== __g) {
      set_class(button_1, __prev.g = __g, undefined, true);
    }
    var __h = " hold and drag to paint cells";
    if (__prev.h !== __h) {
      set_text(text_6, __prev.h = __h);
    }
    var __i = "Alive";
    if (__prev.i !== __i) {
      set_text(text_7, __prev.i = __i);
    }
    var __j = "Dead";
    if (__prev.j !== __j) {
      set_text(text_8, __prev.j = __j);
    }
  }, {
    a: " ",
    b: " ",
    c: " ",
    d: " ",
    e: " ",
    f: " ",
    g: Symbol(),
    h: " ",
    i: " ",
    j: " "
  });
  append(__anchor, fragment);
  pop_component();
}
delegate(["click", "pointerdown"]);

// src/main.ts
var target = document.getElementById("app");
if (!target) {
  throw new Error("Missing #app element");
}
mount(App, { target });

//# debugId=508CA5C7281A95C264756E2164756E21
