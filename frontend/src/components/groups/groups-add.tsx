"use client";

import React, { useState } from "react";

type Item = {
  id: string;
  name: string;
  icon: string;   // path in /public
};

const ROLE_TYPES = ["Healer", "Range DD", "Melee DD", "Support", "Tank", "Battle Mount"];

const ITEMS: Item[] = [
  { id: "galatine-pair", name: "Galatine Pair", icon: "https://render.albiononline.com/v1/item/T8_2H_DUALSCIMITAR_UNDEAD" },
  { id: "carving-sword", name: "Carving Sword", icon: "https://render.albiononline.com/v1/item/T8_2H_DUALSCIMITAR_UNDEAD" },
  { id: "bear-paws", name: "Bear Paws", icon: "https://render.albiononline.com/v1/item/T8_2H_DUALSCIMITAR_UNDEAD" },
  { id: "bloodletter", name: "Bloodletter", icon: "https://render.albiononline.com/v1/item/T8_2H_DUALSCIMITAR_UNDEAD" },
  { id: "clarent-blade", name: "Clarent Blade", icon: "https://render.albiononline.com/v1/item/T8_2H_DUALSCIMITAR_UNDEAD" },
  { id: "demon-fang", name: "Demonfang", icon: "https://render.albiononline.com/v1/item/T8_2H_DUALSCIMITAR_UNDEAD" },
  // …add as many as you want
];

function Slot({
  slotId,
  isFocused,
  onFocus,
  children,
  className = "",
}: {
  slotId: string;
  isFocused: boolean;
  onFocus: (id: string) => void;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isFocused}
      onClick={() => onFocus(slotId)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onFocus(slotId);
        }
      }}
      className={[
        "w-[100%] aspect-square rounded-2xl border bg-black/60",
        "shadow-[0_0_0_2px_rgba(255,255,255,0.05)_inset] flex items-center justify-center",
        "transition-colors outline-none",
        isFocused
          ? "border-[#7c9bff] ring-2 ring-[#7c9bff]/40"
          : "border-white/30 hover:border-white/50",
        className,
      ].join(" ")}
    >
      {children}
      {/* https://render.albiononline.com/v1/item/T8_2H_DUALSCIMITAR_UNDEAD */}
      <img src=""/>
    </div>
  );
}

function ItemCard({
  item,
  onEquip,
  isFocused,
  onFocus,
}: {
  item: Item;
  onEquip?: (item: Item) => void;
  isFocused: boolean;
  onFocus: (id: string) => void;
}) {
  return (
    <div
      onClick={() => onFocus(item.id)}
      className={[
        "grid grid-cols-[40%_60%]",
        "group relative flex items-center gap-1 rounded-xl px-1 py-1",
        "bg-[#1a1d29] border border-white/15",
        isFocused
          ? "border-white/100 hover:border-white/100"
          : "border-white/30 hover:border-white/50",
        "transition shadow-[0_0_0_2px_rgba(255,255,255,0.03)_inset]",
      ].join(" ")}
    >
      <div className="shrink-0">
        <img src={item.icon} alt={item.name} className="w-[100%] h-[100%] rounded-md" />
      </div>
      <div>
        <div className="min-w-0">
          <div className="truncate text-[110%] font-bold text-white/95">
            {item.name}
          </div>
        </div>
        <div className="ml-auto">
          {isFocused && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEquip?.(item);
              }}
              className="w-[80%] rounded-md bg-white/15 px-3 py-1 text-[13px] font-extrabold text-white/95 hover:bg-white/25 transition"
            >
              Equip
            </button>
          )}

        </div>
      </div>
    </div>
  );
}

export default function AddGroup() {
  const [slotInFocus, setSlotInFocus] = useState<string>("none");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [roleType, setRoleType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = name.trim().length > 0 && !submitting;

  const filteredItems = ITEMS.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  function ResetSearch() {
    setSearch("");
  }

  function ResetCharacter() {
    setName("");
    setDescription("");
    setRoleType("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const r = await fetch(`${base}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });
      if (!r.ok) {
        const msg = await r.text();
        alert(`Failed to create group: ${msg || r.status}`);
        return;
      }
      new BroadcastChannel("groups").postMessage("refresh");
      setOpen(false);
      setName("");
      setDescription("");
      setRoleType("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg px-3 py-2 text-sm font-semibold bg-[#19244d] hover:bg-[#1a2b69] text-white transition"
      >
        Add Group
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-max rounded-2xl border border-white/10 bg-[#0b0f17] p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xl color-white font-bold">Add Role</div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1.5 text-sm font-bold
                  bg-[#666666] hover:bg-[#888888] text-white transition
                  border border-white/20
                "
              >
                Close
              </button>
            </div>
            <div className="grid gap-6 md:grid-cols-[300px_1px_650px]">
              {/* Left Side */}
              <div className="grid grid-rows-[50%_50%]">
                <div className="bg-[url('/character-bg.svg')] bg-no-repeat w-[80%] [background-position:50%_2px] place-self-center">
                  <div
                    className="grid gap-x-5 gap-y-2.5 grid-cols-3 grid-rows-[auto_auto_auto_auto] place-items-center"
                  >
                    {/* Row 1 */}
                    <Slot slotId="bag" isFocused={slotInFocus === "bag"} onFocus={setSlotInFocus} className="col-start-1 row-start-1" />
                    <Slot slotId="head" isFocused={slotInFocus === "head"} onFocus={setSlotInFocus} className="col-start-2 row-start-1" />
                    <Slot slotId="cape" isFocused={slotInFocus === "cape"} onFocus={setSlotInFocus} className="col-start-3 row-start-1" />

                    {/* Row 2 */}
                    <Slot slotId="right-hand" isFocused={slotInFocus === "right-hand"} onFocus={setSlotInFocus} className="col-start-1 row-start-2" />
                    <Slot slotId="armor" isFocused={slotInFocus === "armor"} onFocus={setSlotInFocus} className="col-start-2 row-start-2" />
                    <Slot slotId="left-hand" isFocused={slotInFocus === "left-hand"} onFocus={setSlotInFocus} className="col-start-3 row-start-2" />

                    {/* Row 3 */}
                    <Slot slotId="potion" isFocused={slotInFocus === "potion"} onFocus={setSlotInFocus} className="col-start-1 row-start-3" />
                    <Slot slotId="shoes" isFocused={slotInFocus === "shoes"} onFocus={setSlotInFocus} className="col-start-2 row-start-3" />
                    <Slot slotId="food" isFocused={slotInFocus === "food"} onFocus={setSlotInFocus} className="col-start-3 row-start-3" />

                    {/* Extra bottom-center row (Row 4, col 2) */}
                    <Slot slotId="mount" isFocused={slotInFocus === "mount"} onFocus={setSlotInFocus} className="col-start-2 row-start-4" />
                  </div>
                </div>
                <div className="mt-[5%]">
                  <label className="block">
                    <div className="mt-2 mb-1.5 text-m font-medium text-white/90">
                      Role Name <span className="text-red-400">*</span>
                    </div>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-white/25 bg-black/60 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                      placeholder="What is role title?"
                    />
                  </label>
                  <label className="block">
                    <div className="mt-2 mb-1.5 text-m font-medium text-white/90">
                      Role Description
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-white/25 bg-black/60 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20 resize-none"
                      placeholder="What is this group about?"
                    />
                  </label>
                  {/* Drop Down Role Type */}
                  <label className="block">
                    <div className="mt-0.5 mb-1.5 text-m font-medium text-white/90">
                      Role Type <span className="text-red-400">*</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap justify-between">
                      {/* Select */}
                      <div className="relative w-[50%] ">
                        <select
                          value={roleType}
                          onChange={(e) => setRoleType(e.target.value)}
                          className="
                            w-full appearance-none pr-10
                            rounded-lg border border-white/25 bg-black/100
                            px-3 py-2 outline-none
                            focus:ring-2 focus:ring-white/20
                            text-white/90
                          "
                        >
                          <option value="" disabled>
                            Select a type…
                          </option>
                          {ROLE_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>

                        {/* custom chevron */}
                        <svg
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>

                      {/* Button on the right */}
                      <button
                        onClick={() => ResetCharacter()}
                        className="
                          rounded-md px-3 py-1 text-m font-bold
                          bg-[#666666] hover:bg-[#888888] text-white transition
                          whitespace-nowrap
                          border border-white/20
                        "
                      >
                        Reset
                      </button>
                    </div>
                  </label>
                </div>
              </div>
              <div className="hidden md:block w-px bg-white/25 h-150" ></div>
              {/* Right Side */}
              <div>
                <div className="flex">
                  <div className="relative w-[60%]">
                    <button
                      type="button"
                      // onClick={() => handleSearch?.(search)} // or your own search fn
                      className="absolute top-1/2 -translate-y-1/2 grid place-items-center
                        h-10 w-10 rounded-md text-white/70 hover:text-white/90 hover:bg-white/10
                        transition
                      "
                      aria-label="Search"
                    >
                      {/* magnifying glass icon */}
                      <svg viewBox="0 0 20 20" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M12.9 14.32a7 7 0 111.414-1.414l3.39 3.39a1 1 0 01-1.414 1.414l-3.39-3.39zM14 9a5 5 0 11-10 0 5 5 0 0110 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      // onKeyDown={(e) => e.key === "Enter" && handleSearch?.(search)}
                      className="w-full rounded-lg border border-white/25 bg-black/60
                        pl-12 pr-3 py-2 outline-none focus:ring-2 focus:ring-white/20
                      "
                      placeholder="Search item... e.g. Royal Shoes"
                    />
                  </div>
                  <button
                    onClick={() => ResetSearch()}
                    className="
                      rounded-md px-3 my-1 text-m font-bold mx-5
                      bg-[#666666] hover:bg-[#888888] text-white transition
                      whitespace-nowrap
                      border border-white/20
                    "
                  >
                    Reset Filters
                  </button>
                </div>
                <div className="py-3 grid grid-cols-[25%_75%]">
                  <div>
                    <div className="flex px-2 py-1 top-1/2 rounded-s font-bold bg-white/15 hover:bg-white/10 justify-between">
                      Bags & Capes
                      <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                      </svg>
                    </div>
                    <div className="flex px-2 py-1 top-1/2 rounded-s font-bold bg-white/15 hover:bg-white/10 justify-between">
                      Weapons
                      <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                      </svg>
                    </div>
                    <div className="flex px-2 py-1 top-1/2 rounded-s font-bold bg-white/15 hover:bg-white/10 justify-between">
                      Off-Hands
                      <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                      </svg>
                    </div>
                    <div className="flex px-2 py-1 top-1/2 rounded-s font-bold bg-white/15 hover:bg-white/10 justify-between">
                      Head
                      <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                      </svg>
                    </div>
                    <div className="flex px-2 py-1 top-1/2 rounded-s font-bold bg-white/15 hover:bg-white/10 justify-between">
                      Armor
                      <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                      </svg>
                    </div>
                    <div className="flex px-2 py-1 top-1/2 rounded-s font-bold bg-white/15 hover:bg-white/10 justify-between">
                      Shoes
                      <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                      </svg>
                    </div>
                    <div className="flex px-2 py-1 top-1/2 rounded-s font-bold bg-white/15 hover:bg-white/10 justify-between">
                      Mounts
                      <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                      </svg>
                    </div>
                    <div className="flex px-2 py-1 top-1/2 rounded-s font-bold bg-white/15 hover:bg-white/10 justify-between">
                      Potions
                      <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                      </svg>
                    </div>
                    <div className="flex px-2 py-1 top-1/2 rounded-s font-bold bg-white/15 hover:bg-white/10 justify-between">
                      Food
                      <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                      </svg>
                    </div>
                  </div>
                  {/* Items Display */}
                  <div className="px-2 grow">
                    <div
                      className="
                        max-h-[440px] overflow-y-auto pr-2
                        grid gap-3
                        grid-cols-1 sm:grid-cols-2
                      "
                    >
                      {filteredItems.length === 0 ? (
                        <div className="col-span-full rounded-xl border border-white/10 bg-white/5 p-6 text-center text-white/60">
                          No items match your search.
                        </div>
                      ) : (
                        filteredItems.map((item, idx) => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            isFocused={slotInFocus === item.id}
                            onFocus={setSlotInFocus}
                            onEquip={(it) => {
                              // example: put equipped item into the focused slot
                              // if you want that behavior, you already track slotInFocus
                              if (slotInFocus === "none") return;
                              console.log("Equip", it.name, "to", slotInFocus);
                              // TODO: save selection to state you use for each slot
                            }}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
