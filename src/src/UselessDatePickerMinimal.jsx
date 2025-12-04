import React, { useMemo, useState } from "react";

// Bad UX: Minimal, blacked-out, drag-into-slots chaos
// Update: increase horizontal safe space for floating keys

const DIGITS = "000111222333444555666777888999".split("");
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZJFMASONDAEPUCONBRYLGPTVC".split("");

// Token and Slot type definitions removed for JavaScript compatibility

function makeInitialTokens() {
  const src = [];

  // Ultra-dense grid configuration - buttons overlap slightly to fill all space
  // Key size is approximately 3rem = 48px, using percentage-based spacing
  const KEY_SIZE_PERCENT = 3.0; // Smaller to allow more buttons
  const KEY_SPACING_PERCENT = -0.4; // More negative spacing for tighter overlap
  const TOTAL_KEY_SIZE = KEY_SIZE_PERCENT + KEY_SPACING_PERCENT;
  
  // Exclusion zone only for input area (under the date picker)
  const isInsideExcluded = (top, left) => {
    // Exclude area under input: vertically 35% to 65%, horizontally 30% to 70%
    return top > 44 && top < 50 && left > 30 && left < 70;
  };

  // Collect all tokens first
  const allTokens = [];
  for (let set = 0; set < 30; set++) {
    for (const d of DIGITS) {
      allTokens.push({ kind: "digit", char: d, set });
    }
  }
  for (let set = 0; set < 10; set++) {
    for (const l of LETTERS) {
      allTokens.push({ kind: "letter", char: l, set });
    }
  }

  // Create ultra-dense grid positions - fill every possible space
  const positions = [];
  const colsPerRow = Math.ceil(100 / TOTAL_KEY_SIZE) + 2; // Extra columns to ensure coverage
  const rowsCount = Math.ceil(100 / TOTAL_KEY_SIZE) + 2; // Extra rows to ensure coverage
  
  // Generate positions covering entire screen, including edges
  for (let row = -1; row <= rowsCount; row++) {
    for (let col = -1; col <= colsPerRow; col++) {
      const top = row * TOTAL_KEY_SIZE;
      const left = col * TOTAL_KEY_SIZE;
      
      // Only add positions outside excluded area and within reasonable bounds
      if (!isInsideExcluded(top, left) && top >= -5 && top <= 105 && left >= -5 && left <= 105) {
        positions.push({ top, left });
      }
    }
  }
  
  // Add extra positions around edges and corners to ensure complete coverage
  for (let i = 0; i < 100; i++) {
    const edge = Math.floor(Math.random() * 4);
    let top, left;
    switch(edge) {
      case 0: // Top edge
        top = Math.random() * 10;
        left = Math.random() * 100;
        break;
      case 1: // Right edge
        top = Math.random() * 100;
        left = 90 + Math.random() * 10;
        break;
      case 2: // Bottom edge
        top = 90 + Math.random() * 10;
        left = Math.random() * 100;
        break;
      case 3: // Left edge
        top = Math.random() * 100;
        left = Math.random() * 10;
        break;
    }
    if (!isInsideExcluded(top, left)) {
      positions.push({ top, left });
    }
  }
  
  // Shuffle positions for randomness
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // Assign tokens to positions, reusing positions if we have more tokens than positions
  allTokens.forEach((token, index) => {
    const pos = positions[index % positions.length];
    
    let { top, left } = pos;
    
    // Ensure position is not in excluded area
    if (isInsideExcluded(top, left)) {
      // Push to nearest edge of excluded zone
      if (top >= 35 && top <= 65) {
        top = top < 50 ? 30 : 70;
      }
      if (left >= 30 && left <= 70) {
        left = left < 50 ? 25 : 75;
      }
    }

    const dur = 4 + Math.random() * 16;
    const delay = -Math.random() * dur;
    src.push({
      id: `${token.kind}-${token.char}-set${token.set}-${Math.random().toString(36).slice(2, 6)}`,
      char: token.char,
      kind: token.kind,
      top,
      left,
      dur,
      delay,
    });
  });

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

  // Check if all slots are filled
  const allSlotsFilled = useMemo(() => {
    return slots.every(slot => slot.value && slot.value !== "_");
  }, [slots]);


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
      // respawn in ultra-dense grid, avoiding input area
      const KEY_SIZE_PERCENT = 3.0;
      const KEY_SPACING_PERCENT = -0.4;
      const TOTAL_KEY_SIZE = KEY_SIZE_PERCENT + KEY_SPACING_PERCENT;
      
      // Find a random position in the dense grid
      const colsPerRow = Math.ceil(100 / TOTAL_KEY_SIZE) + 2;
      const rowsCount = Math.ceil(100 / TOTAL_KEY_SIZE) + 2;
      
      let top = 0, left = 0;
      let attempts = 0;
      do {
        const row = Math.floor(Math.random() * (rowsCount + 2)) - 1;
        const col = Math.floor(Math.random() * (colsPerRow + 2)) - 1;
        top = row * TOTAL_KEY_SIZE;
        left = col * TOTAL_KEY_SIZE;
        attempts++;
      } while ((top > 35 && top < 65 && left > 30 && left < 70) && attempts < 100);
      
      // If still in excluded area, push to edge
      if (top > 35 && top < 65 && left > 30 && left < 70) {
        if (top >= 35 && top <= 65) {
          top = top < 50 ? 30 : 70;
        }
        if (left >= 30 && left <= 70) {
          left = left < 50 ? 25 : 75;
        }
      }
      
      // Ensure position is within bounds
      if (top < -5) top = -5;
      if (top > 105) top = 105;
      if (left < -5) left = -5;
      if (left > 105) left = 105;
      return [
        ...without,
        { id: `${kind}-${prevVal}-${Math.random().toString(36).slice(2, 6)}`, char: prevVal, kind, top, left, dur: 4 + Math.random() * 16, delay: -Math.random() * (4 + Math.random() * 16) },
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

      <div className="content-container">
        <h1 className="date-header">Pick a date</h1>
        <div className="input-groups">
            <Group label="" cols={2} startIndex={0} onDropSlot={onDropSlot} slots={slots} allSlotsFilled={allSlotsFilled} />
            <Group label="" cols={3} startIndex={2} onDropSlot={onDropSlot} slots={slots} allSlotsFilled={allSlotsFilled} />
            <Group label="" cols={4} startIndex={5} onDropSlot={onDropSlot} slots={slots} allSlotsFilled={allSlotsFilled} />
        </div>
        <button
          onClick={onReset}
          className="reset-button"
          title="Reset"
        >
          Reset
        </button>
      </div>

      {/* <div className="fixed bottom-3 left-1/2 -translate-x-1/2 text-neutral-700 font-mono text-xs tracking-widest">
        {day} {mon} {year}
      </div> */}


 

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

function Group({ cols, startIndex, onDropSlot, slots, allSlotsFilled }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: cols }).map((_, i) => {
        const idx = startIndex + i;
        const s = slots[idx];
        return (
          <div key={s.id} className="flex flex-col items-center">
            <div
              className={`drop-slot ${allSlotsFilled ? 'all-filled' : ''}`}
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
