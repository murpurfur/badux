import React, { useMemo, useState } from "react";

// Bad UX: Minimal, blacked-out, drag-into-slots chaos
// Update: increase horizontal safe space for floating keys

const DIGITS = "0123456789".split("");
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Token and Slot type definitions removed for JavaScript compatibility

function makeInitialTokens() {
  const src = [];

  // Increase horizontal safe area around center region
  const isInsideExcluded = (top, left) => {
    // Exclude wider horizontally (like 30% to 70%) and vertically moderate (35% to 65%)
    return top > 35 && top < 65 && left > 30 && left < 70;
  };

  const pushToken = (kind, char, set) => {
    let top = 0,
      left = 0;
    do {
      top = Math.random() * 95;
      left = Math.random() * 95;
    } while (isInsideExcluded(top, left));

    const dur = 6 + Math.random() * 12;
    const delay = -Math.random() * dur;
    src.push({
      id: `${kind}-${char}-set${set}-${Math.random().toString(36).slice(2, 6)}`,
      char,
      kind,
      top,
      left,
      dur,
      delay,
    });
  };

  for (let set = 0; set < 10; set++) {
    for (const d of DIGITS) pushToken("digit", d, set);
  }
  for (let set = 0; set < 10; set++) {
    for (const l of LETTERS) pushToken("letter", l, set);
  }
  return src;
}

function makeSlots() {
  return [
    { id: "d1", expect: "digit" },
    { id: "d2", expect: "digit" },
    { id: "m1", expect: "letter" },
    { id: "m2", expect: "letter" },
    { id: "m3", expect: "letter" },
    { id: "y1", expect: "digit" },
    { id: "y2", expect: "digit" },
    { id: "y3", expect: "digit" },
    { id: "y4", expect: "digit" },
  ];
}

export default function UselessDatePickerMinimal() {
  const [tokens, setTokens] = useState(() => makeInitialTokens());
  const [slots, setSlots] = useState(() => makeSlots());


  function joinVals(ss) {
    return ss.map((s) => s.value ?? "_").join("");
  }

  function onDragStart(e, id) {
    e.dataTransfer.setData("text/plain", id);
  }

  function bounceToken(id) {
    const el = document.querySelector(`[data-token-id="${id}"]`);
    if (!el) return;
    el.classList.add("bounce-back");
    setTimeout(() => el.classList.remove("bounce-back"), 500);
  }

  function validateDrop(slotIndex, token) {
    // Slots: 0-1 day, 2-4 month, 5-8 year

    // Day rules (01..31)
    if (slotIndex === 0) {
      // first day digit allowed 0-3
      return /[0-3]/.test(token.char);
    }
    if (slotIndex === 1) {
      // second digit 0-9 but combined <= 31 and >= 01
      const d1 = slots[0].value;
      const d2 = token.char;
      if (!d1) return /[0-9]/.test(d2);
      const num = parseInt(`${d1}${d2}`, 10);
      return num >= 1 && num <= 31;
    }

    // Month validation with proper combination checking
    const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    
    // Helper function to get valid letters for each position based on current state
    function getValidLettersForPosition(pos, currentValues) {
      const [m1, m2, m3] = currentValues;
      
      if (pos === 2) { // First position
        if (m2 && m3) {
          // If we have 2nd and 3rd letters, find months that end with m2+m3
          return MONTHS.filter(month => month[1] === m2 && month[2] === m3).map(month => month[0]);
        } else if (m2) {
          // If we have 2nd letter, find months that have m2 in 2nd position
          return MONTHS.filter(month => month[1] === m2).map(month => month[0]);
        } else if (m3) {
          // If we have 3rd letter, find months that have m3 in 3rd position
          return MONTHS.filter(month => month[2] === m3).map(month => month[0]);
        } else {
          // No other letters, return all possible first letters
          return [...new Set(MONTHS.map(month => month[0]))];
        }
      }
      
      if (pos === 3) { // Second position
        if (m1 && m3) {
          // If we have 1st and 3rd letters, find months that start with m1 and end with m3
          return MONTHS.filter(month => month[0] === m1 && month[2] === m3).map(month => month[1]);
        } else if (m1) {
          // If we have 1st letter, find months that start with m1
          return MONTHS.filter(month => month[0] === m1).map(month => month[1]);
        } else if (m3) {
          // If we have 3rd letter, find months that end with m3
          return MONTHS.filter(month => month[2] === m3).map(month => month[1]);
        } else {
          // No other letters, return all possible second letters
          return [...new Set(MONTHS.map(month => month[1]))];
        }
      }
      
      if (pos === 4) { // Third position
        if (m1 && m2) {
          // If we have 1st and 2nd letters, find months that start with m1+m2
          return MONTHS.filter(month => month[0] === m1 && month[1] === m2).map(month => month[2]);
        } else if (m1) {
          // If we have 1st letter, find months that start with m1
          return MONTHS.filter(month => month[0] === m1).map(month => month[2]);
        } else if (m2) {
          // If we have 2nd letter, find months that have m2 in 2nd position
          return MONTHS.filter(month => month[1] === m2).map(month => month[2]);
        } else {
          // No other letters, return all possible third letters
          return [...new Set(MONTHS.map(month => month[2]))];
        }
      }
      
      return [];
    }
    
    // Validate month positions
    if (slotIndex >= 2 && slotIndex <= 4) {
      const m1 = slots[2].value ? slots[2].value.toUpperCase() : "";
      const m2 = slots[3].value ? slots[3].value.toUpperCase() : "";
      const m3 = slots[4].value ? slots[4].value.toUpperCase() : "";
      
      const validLetters = getValidLettersForPosition(slotIndex, [m1, m2, m3]);
      const char = token.char.toUpperCase();
      
      return validLetters.includes(char);
    }

    // Year rules (<= 2999)
    if (slotIndex === 5) {
      // first year digit 0..2 only
      return /[0-2]/.test(token.char);
    }
    if (slotIndex >= 6 && slotIndex <= 8) {
      if (slotIndex < 8) return /[0-9]/.test(token.char);
      const y1 = slots[5].value ?? "_";
      const y2 = slots[6].value ?? "_";
      const y3 = slots[7].value ?? "_";
      const y4 = token.char;
      const candidate = (y1 + y2 + y3 + y4).replace(/_/g, "0");
      const num = parseInt(candidate, 10);
      return num <= 2999;
    }

    return true;
  }

  function onDropSlot(e, slotIndex) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const t = tokens.find((x) => x.id === id);
    if (!t) return;

    const target = slots[slotIndex];
    if (t.kind !== target.expect || !validateDrop(slotIndex, t)) {
      // Force animation restart with more reliable method
      const element = e.currentTarget;
      element.classList.remove("shake");
      // Force a reflow to ensure the class removal is processed
      element.offsetHeight;
      element.classList.add("shake");
      setTimeout(() => element.classList.remove("shake"), 500);
      bounceToken(id);
      return;
    }

    const prevVal = target.value;

    setSlots((prev) => {
      const copy = [...prev];
      const val = t.kind === "letter" ? t.char.toUpperCase() : t.char;
      copy[slotIndex] = { ...copy[slotIndex], value: val };
      return copy;
    });

    // Add magnification effect to the slot
    const slotElement = document.querySelector(`[data-slot-id="${slots[slotIndex].id}"]`);
    if (slotElement) {
      slotElement.classList.add('magnify-success');
      setTimeout(() => slotElement.classList.remove('magnify-success'), 600);
    }

    setTokens((prev) => {
      const without = prev.filter((x) => x.id !== t.id);
      if (!prevVal) return without;
      const kind = /[0-9]/.test(prevVal) ? "digit" : "letter";
      // respawn previous outside safe zone
      let top = 0, left = 0;
      do { top = Math.random() * 95; left = Math.random() * 95; } while (left > 30 && left < 70 && top > 35 && top < 65);
      return [
        ...without,
        { id: `${kind}-${prevVal}-${Math.random().toString(36).slice(2, 6)}`, char: prevVal, kind, top, left, dur: 10, delay: 0 },
      ];
    });
  }

  function onReset() {
    setTokens(makeInitialTokens());
    setSlots(makeSlots());
  }

  return (
    <div className="main-container">
      <div className="floating-tokens-container">
        {tokens.map((t) => (
          <div
            key={t.id}
            className="floating-token"
            data-token-id={t.id}
            style={{
              top: `${t.top}%`,
              left: `${t.left}%`,
              ['--dur']: `${t.dur}s`,
              ['--delay']: `${t.delay}s`,
            }}
            draggable
            onDragStart={(e) => onDragStart(e, t.id)}
          >
            <Keycap>{t.char}</Keycap>
          </div>
        ))}
      </div>

      <div className="min-h-screen w-full grid place-items-center">
        <div className="flex items-center gap-6">
          <Group label="" cols={2} startIndex={0} onDropSlot={onDropSlot} slots={slots} />
          <Group label="" cols={3} startIndex={2} onDropSlot={onDropSlot} slots={slots} />
          <Group label="" cols={4} startIndex={5} onDropSlot={onDropSlot} slots={slots} />
        </div>
      </div>

      {/* <div className="fixed bottom-3 left-1/2 -translate-x-1/2 text-neutral-700 font-mono text-xs tracking-widest">
        {day} {mon} {year}
      </div> */}

      <div className="fixed top-3 left-1/2 -translate-x-1/2">
        <button
          onClick={onReset}
          className="px-3 py-1 rounded-md border border-neutral-800 bg-neutral-900 text-neutral-300 text-xs tracking-widest hover:text-white"
          title="Reset"
        >
          Reset
        </button>
      </div>

 

      <style>{`
        .token { animation: float var(--dur, 10s) ease-in-out infinite; animation-delay: var(--delay, 0s); }
        @keyframes float {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(8px, -6px) rotate(1deg); }
          50% { transform: translate(-6px, 8px) rotate(-1deg); }
          75% { transform: translate(6px, 4px) rotate(0.5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        .bounce-back { animation: bounceBack 0.5s ease; }
        @keyframes bounceBack { 0% { transform: translateY(0) scale(1); } 40% { transform: translateY(-18px) scale(1.06); } 100% { transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}

function Group({ cols, startIndex, onDropSlot, slots }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: cols }).map((_, i) => {
        const idx = startIndex + i;
        const s = slots[idx];
        return (
          <div key={s.id} className="flex flex-col items-center">
            <div
              className="drop-slot"
              data-slot-id={s.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDropSlot(e, idx)}
              title={s.expect === "digit" ? "Drop a digit" : "Drop a letter"}
            >
              {s.value ?? "_"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Keycap({ children }) {
  return (
    <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_20px_rgba(0,0,0,0.5)] grid place-items-center text-neutral-200 font-semibold select-none cursor-grab active:cursor-grabbing">
      {children}
    </div>
  );
}
