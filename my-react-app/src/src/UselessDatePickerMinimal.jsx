import React, { useMemo, useState } from "react";

// Bad UX: Minimal, blacked-out, drag-into-slots chaos
// Update: increase horizontal safe space for floating keys

const DIGITS = "0123456789".split("");
const LETTERS = "ABCDEFGHIJ".split("");

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

  const day = useMemo(() => joinVals(slots.slice(0, 2)), [slots]);
  const mon = useMemo(() => joinVals(slots.slice(2, 5)), [slots]);
  const year = useMemo(() => joinVals(slots.slice(5, 9)), [slots]);

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

    // Month rules with cascading validation
    const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    
    // 3rd position (first letter): Only allow letters that start valid months
    if (slotIndex === 2) {
      const first = token.char.toUpperCase();
      return MONTHS.some(month => month.startsWith(first));
    }
    
    // 4th position (second letter): Only allow letters that work with the first letter
    if (slotIndex === 3) {
      const m1 = slots[2].value ? slots[2].value.toUpperCase() : "";
      if (!m1) return false; // Must have first letter
      
      const second = token.char.toUpperCase();
      // Find all months that start with m1, then check if second letter is valid
      const validMonths = MONTHS.filter(month => month.startsWith(m1));
      return validMonths.some(month => month[1] === second);
    }
    
    // 5th position (third letter): Only allow letters that complete the month
    if (slotIndex === 4) {
      const m1 = slots[2].value ? slots[2].value.toUpperCase() : "";
      const m2 = slots[3].value ? slots[3].value.toUpperCase() : "";
      if (!m1 || !m2) return false; // Must have first two letters
      
      const third = token.char.toUpperCase();
      // Check if the complete month is valid
      const completeMonth = m1 + m2 + third;
      return MONTHS.includes(completeMonth);
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
      e.currentTarget.classList.add("shake");
      setTimeout(() => e.currentTarget.classList.remove("shake"), 500);
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

      <button
        onClick={onReset}
        className="fixed top-3 right-3 text-[10px] uppercase tracking-widest text-neutral-700 hover:text-neutral-400"
        title="Reset"
      >
        Reset
      </button>

      <style>{`
        .token { animation: float var(--dur, 10s) ease-in-out infinite; animation-delay: var(--delay, 0s); }
        @keyframes float {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(8px, -6px) rotate(1deg); }
          50% { transform: translate(-6px, 8px) rotate(-1deg); }
          75% { transform: translate(6px, 4px) rotate(0.5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        .shake { animation: shake 0.45s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
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
