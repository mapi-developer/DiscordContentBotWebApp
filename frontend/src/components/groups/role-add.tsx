"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Item } from "@/src/types/item";

const SPECIAL_TYPES = ["MEAL", "POTION", "MOUNT"] as const;

export type SlotId =
  | "bag"
  | "cape"
  | "head"
  | "armor"
  | "shoes"
  | "weapon"
  | "off_hand"
  | "potion"
  | "food"
  | "mount";

export type RoleConfig = {
  uuid?: string;
  name: string;
  description: string;
  roleType: string;
  slotItems: Record<SlotId, Item | null>;
};

type RoleAddModalProps = {
  open: boolean;
  initialRole?: RoleConfig | null;
  onCancel: () => void;
  onSave: (role: RoleConfig) => void;
};

type Category = {
  id: string;
  label: string;
  subs?: { id: string; label: string }[];
};

const ROLE_TYPES = [
  "Healer",
  "Range DD",
  "Melee DD",
  "Support",
  "Tank",
  "Battle Mount",
];

const CATEGORIES: Category[] = [
  {
    id: "bag_cape",
    label: "Bags & Capes",
    subs: [
      { id: "bag", label: "Bags" },
      { id: "cape", label: "Capes" },
    ],
  },
  {
    id: "weapon",
    label: "Weapons",
    subs: [
      { id: "arcane_staff", label: "Arcane Staffs" },
      { id: "axe", label: "Axes" },
      { id: "crossbow", label: "Crossbows" },
      { id: "cursed_staff", label: "Cursed Staffs" },
      { id: "dagger", label: "Daggers" },
      { id: "fire_staff", label: "Fire Staffs" },
      { id: "frost_staff", label: "Frost Staffs" },
      { id: "hammer", label: "Hammers" },
      { id: "holy_staff", label: "Holy Staffs" },
      { id: "war_glove", label: "War Gloves" },
      { id: "mace", label: "Maces" },
      { id: "nature_staff", label: "Nature Staffs" },
      { id: "quarterstaff", label: "Quarterstaffs" },
      { id: "shapeshifter_staff", label: "Shapeshifter Staffs" },
      { id: "spear", label: "Spears" },
      { id: "sword", label: "Swords" },
      { id: "bow", label: "Bows" },
    ],
  },
  {
    id: "off_hand",
    label: "Off-Hands",
    subs: [
      { id: "mage", label: "Mage" },
      { id: "hunter", label: "Hunter" },
      { id: "warrior", label: "Warrior" },
    ],
  },
  {
    id: "head",
    label: "Head",
    subs: [
      { id: "cloth", label: "Cloth Head" },
      { id: "leather", label: "Leather Head" },
      { id: "plate", label: "Plate Head" },
    ],
  },
  {
    id: "armor",
    label: "Armor",
    subs: [
      { id: "cloth", label: "Cloth Armor" },
      { id: "leather", label: "Leather Armor" },
      { id: "plate", label: "Plate Armor" },
    ],
  },
  {
    id: "shoes",
    label: "Shoes",
    subs: [
      { id: "cloth", label: "Cloth Shoes" },
      { id: "leather", label: "Leather Shoes" },
      { id: "plate", label: "Plate Shoes" },
    ],
  },
  {
    id: "mount",
    label: "Mounts",
    subs: [
      { id: "base", label: "Base Mounts" },
      { id: "rare", label: "Rare Mounts" },
      { id: "battle", label: "Battle Mounts" },
    ],
  },
  { id: "potion", label: "Potions", subs: [] },
  { id: "food", label: "Food", subs: [] },
];

function getItemIcon(item: Item | null): string | null {
  if (!item) return null;
  const isSpecial = SPECIAL_TYPES.some((el) =>
    item.item_db_name.includes(el),
  );
  return isSpecial
    ? `https://render.albiononline.com/v1/item/${item.item_db_name}`
    : `https://render.albiononline.com/v1/item/T8_${item.item_db_name}`;
}

function Slot(props: {
  slot_id: SlotId;
  is_focused: boolean;
  slot_item: Item | null;
  onFocus: (id: SlotId) => void;
  onRemove?: (slot_id: SlotId) => void;
  className?: string;
  disabled?: boolean;
}) {
  const {
    slot_id,
    is_focused,
    slot_item,
    onFocus,
    onRemove,
    className,
    disabled = false,
  } = props;

  const img_src = getItemIcon(slot_item);

  return (
    <button
      onClick={() => {
        if (!disabled) onFocus(slot_id);
      }}
      className={[
        "w-full aspect-square rounded-2xl border-2 bg-black/60",
        "shadow-[0_0_0_2px_rgba(255,255,255,0.05)_inset] flex items-center justify-center",
        "transition-colors outline-none relative",
        disabled
          ? "border-white/10 opacity-40 cursor-not-allowed"
          : is_focused
            ? "border-blue-500 cursor-pointer"
            : "border-white/30 hover:border-white/50 cursor-pointer",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {img_src ? (
        <img
          src={img_src}
          alt={slot_item?.item_name ?? slot_id}
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="text-[10px] uppercase tracking-wide text-white/40">
          Empty
        </span>
      )}

      {is_focused && slot_item && !disabled && onRemove && (
        <div
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(slot_id);
          }}
          className={[
            "rounded-sm absolute top-1 right-1 z-10",
            "px-2 py-1 text-[10px] font-bold leading-none",
            "bg-red-700 hover:bg-red-800 text-white",
            "hover:border hover:border-[#592516] shadow-lg",
            "bg-[url('/cross.svg')] bg-no-repeat bg-center",
            "h-[30%] w-[30%]",
          ].join(" ")}
        >
        </div>
      )}
    </button>
  );
}

function ItemCard(props: {
  item: Item;
  onEquip?: (item: Item) => void;
  isFocused: boolean;
  onFocus: (id: string) => void;
}) {
  const { item, onEquip, isFocused, onFocus } = props;
  const img_src = getItemIcon(item);

  return (
    <div
      onClick={() => onFocus(item.id)}
      className={[
        "grid grid-cols-[40%_60%]",
        "group relative flex items-center gap-1 rounded-xl px-1 py-1",
        "bg-[#1a1d29] border",
        isFocused
          ? "border-blue-500 hover:border-blue-500"
          : "border-white/30 hover:border-white/50",
        "transition shadow-[0_0_0_2px_rgba(255,255,255,0.03)_inset]",
      ].join(" ")}
    >
      <div className="shrink-0">
        {img_src && (
          <img
            src={img_src}
            alt={item.item_name}
            className="w-full h-full rounded-md"
          />
        )}
      </div>

      <div className="min-w-0">
        <div className="truncate text-[110%] font-bold text-white/95">
          {item.item_name}
        </div>

        <div className="text-[11px] text-white/50 leading-tight">
          {item.item_category_main}
          {item.item_category_second
            ? ` · ${item.item_category_second}`
            : null}
        </div>

        <div className="ml-auto mt-2">
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

function makeEmptyRole(): RoleConfig {
  return {
    uuid: undefined,
    name: "",
    description: "",
    roleType: "",
    slotItems: {
      bag: null,
      cape: null,
      head: null,
      armor: null,
      shoes: null,
      weapon: null,
      off_hand: null,
      potion: null,
      food: null,
      mount: null,
    },
  };
}

const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function RoleAddModal({
  open,
  initialRole,
  onCancel,
  onSave,
}: RoleAddModalProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);

  const [role, setRole] = useState<RoleConfig>(makeEmptyRole);
  const [slotInFocus, setSlotInFocus] = useState<SlotId | null>(null);
  const [itemInFocus, setItemInFocus] = useState<string | null>(null);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [openSubCategory, setOpenSubCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [offHandDisabled, setOffHandDisabled] = useState(false);
  const [offHandMirrorsWeapon, setOffHandMirrorsWeapon] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    async function loadItems() {
      setItemsLoading(true);
      setItemsError(null);
      try {
        const res = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/items`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || `HTTP ${res.status}`);
        }
        const data: Item[] = await res.json();
        if (!cancelled) setItems(data);
      } catch (err: any) {
        if (!cancelled)
          setItemsError(err.message ?? "Failed to load items");
      } finally {
        if (!cancelled) setItemsLoading(false);
      }
    }

    loadItems();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const baseRole = initialRole ?? makeEmptyRole();
    setRole(baseRole);
    setSlotInFocus(null);
    setItemInFocus(null);
    setOpenCategoryId(null);
    setOpenSubCategory(null);

    const isTwoHanded =
      baseRole.slotItems.weapon?.item_db_name.includes("2H_") ?? false;
    setOffHandDisabled(isTwoHanded);
    setOffHandMirrorsWeapon(isTwoHanded);
  }, [open, initialRole]);

  function toggleCategory(catId: string) {
    if (openCategoryId === catId) {
      setOpenCategoryId(null);
      setOpenSubCategory(null);
    } else {
      setOpenCategoryId(catId);
      setOpenSubCategory(null);
    }
  }

  function toggleSubCategory(subId: string) {
    setOpenSubCategory((prev) => (prev === subId ? null : subId));
  }

  function toggleSlot(slotId: SlotId) {
    if (slotId === "off_hand" && offHandDisabled) return;
    setSlotInFocus((prev) => (prev === slotId ? null : slotId));
  }

  function equipItemToFocusedSlot(it: Item) {
    if (!slotInFocus) return;

    setRole((prev) => {
      const next: RoleConfig = {
        ...prev,
        slotItems: { ...prev.slotItems, [slotInFocus]: it },
      };

      if (slotInFocus === "weapon") {
        const isTwoHanded = it.item_db_name.includes("2H_");
        if (isTwoHanded) {
          next.slotItems.off_hand = null;
        }
        setOffHandDisabled(isTwoHanded);
        setOffHandMirrorsWeapon(isTwoHanded);
      }

      return next;
    });
  }

  function clearSlot(slotId: SlotId) {
    setRole((prev) => {
      const next: RoleConfig = {
        ...prev,
        slotItems: { ...prev.slotItems, [slotId]: null },
      };

      if (slotId === "weapon") {
        setOffHandDisabled(false);
        setOffHandMirrorsWeapon(false);
      }

      return next;
    });
  }

  function resetSearch() {
    setSearch("");
    setOpenCategoryId(null);
    setOpenSubCategory(null);
  }

  function resetCharacter() {
    role.name = ""
    role.description = ""
    role.roleType = ""
    clearSlot("bag");
    clearSlot("head");
    clearSlot("cape");
    clearSlot("weapon");
    clearSlot("armor");
    clearSlot("off_hand");
    clearSlot("potion");
    clearSlot("shoes");
    clearSlot("food");
    clearSlot("mount");
    setSlotInFocus(null);
  }

  const filteredItems = useMemo(() => {
    let out = items;

    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((i) =>
        i.item_name.toLowerCase().includes(q),
      );
    }

    if (slotInFocus) {
      out = out.filter((i) => {
        switch (slotInFocus) {
          case "weapon":
            return i.item_category_main === "weapon";
          case "off_hand":
            return i.item_category_main === "off_hand";
          case "head":
            return i.item_category_main === "head";
          case "armor":
            return i.item_category_main === "armor";
          case "shoes":
            return i.item_category_main === "shoes";
          case "food":
            return i.item_category_main === "food";
          case "potion":
            return i.item_category_main === "potion";
          case "mount":
            return i.item_category_main === "mount";
          case "bag":
            return (
              i.item_category_main === "bag_cape" &&
              i.item_category_second === "bag"
            );
          case "cape":
            return (
              i.item_category_main === "bag_cape" &&
              i.item_category_second === "cape"
            );
          default:
            return true;
        }
      });
    }

    if (openCategoryId) {
      out = out.filter((i) => i.item_category_main === openCategoryId);
    }

    if (openSubCategory) {
      out = out.filter(
        (i) => i.item_category_second === openSubCategory,
      );
    }

    return out;
  }, [items, search, slotInFocus, openCategoryId, openSubCategory]);

  const canSave =
    role.name.trim().length > 0 &&
    role.roleType.trim().length > 0 &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSubmitting(true);
    try {
      const clean: RoleConfig = {
        ...role,
        name: role.name.trim(),
        description: role.description.trim(),
        roleType: role.roleType.trim(),
      };
      onSave(clean);
      onCancel();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-max rounded-2xl border border-white/10 bg-[#0b0f17] p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xl color-white font-bold">Add Role</div>
            </div>
            <div onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-[300px_1px_650px]">
              {/* Left Side */}
              <div className="grid grid-rows-[50%_50%]">
                <div className="bg-[url('/character-bg.svg')] bg-no-repeat w-[80%] bg-position:[50%_2px] place-self-center">
                  <div
                    className="grid gap-x-5 gap-y-2.5 grid-cols-3 grid-rows-[auto_auto_auto_auto] place-items-center"
                  >
                    {/* Row 1 */}
                    <Slot
                      slot_id="bag"
                      is_focused={slotInFocus === "bag"}
                      onFocus={toggleSlot}
                      onRemove={clearSlot}
                      className="col-start-1 row-start-1"
                      slot_item={role.slotItems.bag}
                    />
                    <Slot
                      slot_id="head"
                      is_focused={slotInFocus === "head"}
                      onFocus={toggleSlot}
                      onRemove={clearSlot}
                      className="col-start-2 row-start-1"
                      slot_item={role.slotItems.head}
                    />
                    <Slot
                      slot_id="cape"
                      is_focused={slotInFocus === "cape"}
                      onFocus={toggleSlot}
                      onRemove={clearSlot}
                      className="col-start-3 row-start-1"
                      slot_item={role.slotItems.cape}
                    />

                    {/* Row 2 */}
                    <Slot
                      slot_id="weapon"
                      is_focused={slotInFocus === "weapon"}
                      onFocus={toggleSlot}
                      onRemove={clearSlot}
                      className="col-start-1 row-start-2"
                      slot_item={role.slotItems.weapon}
                    />
                    <Slot
                      slot_id="armor"
                      is_focused={slotInFocus === "armor"}
                      onFocus={toggleSlot}
                      onRemove={clearSlot}
                      className="col-start-2 row-start-2"
                      slot_item={role.slotItems.armor}
                    />
                    <Slot
                      slot_id="off_hand"
                      is_focused={slotInFocus === "off_hand"}
                      onFocus={toggleSlot}
                      onRemove={clearSlot}
                      className="col-start-3 row-start-2"
                      slot_item={
                        offHandMirrorsWeapon
                          ? role.slotItems.weapon
                          : role.slotItems.off_hand
                      }
                      disabled={offHandDisabled}
                    />

                    {/* Row 3 */}
                    <Slot
                      slot_id="potion"
                      is_focused={slotInFocus === "potion"}
                      onFocus={toggleSlot}
                      onRemove={clearSlot}
                      className="col-start-1 row-start-3"
                      slot_item={role.slotItems.potion}
                    />
                    <Slot
                      slot_id="shoes"
                      is_focused={slotInFocus === "shoes"}
                      onFocus={toggleSlot}
                      onRemove={clearSlot}
                      className="col-start-2 row-start-3"
                      slot_item={role.slotItems.shoes}
                    />
                    <Slot
                      slot_id="food"
                      is_focused={slotInFocus === "food"}
                      onFocus={toggleSlot}
                      onRemove={clearSlot}
                      className="col-start-3 row-start-3"
                      slot_item={role.slotItems.food}
                    />

                    {/* Extra bottom-center row (Row 4, col 2) */}
                    <Slot
                      slot_id="mount"
                      is_focused={slotInFocus === "mount"}
                      onFocus={toggleSlot}
                      onRemove={clearSlot}
                      className="col-start-2 row-start-4"
                      slot_item={role.slotItems.mount}
                    />
                  </div>
                </div>
                <div className="mt-[5%]">
                  <label className="block">
                    <div className="mt-2 mb-1.5 text-m font-medium text-white/90">
                      Role Name <span className="text-red-400">*</span>
                    </div>
                    <input
                      value={role.name}
                      onChange={(e) =>
                        setRole((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full rounded-lg border border-white/25 bg-black/60 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                      placeholder="What is role title?"
                    />
                  </label>
                  <label className="block">
                    <div className="mt-2 mb-1.5 text-m font-medium text-white/90">
                      Role Description
                    </div>
                    <textarea
                      value={role.description}
                      onChange={(e) =>
                        setRole((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
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
                          value={role.roleType}
                          onChange={(e) =>
                            setRole((prev) => ({
                              ...prev,
                              roleType: e.target.value,
                            }))
                          }
                          className="
                            w-full appearance-none pr-10
                            rounded-lg border border-white/25 bg-black
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
                        onClick={resetCharacter}
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
                    onClick={resetSearch}
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
                <div className="py-3 grid grid-cols-[25%_75%] min-h-110 max-h-120">
                  <div
                    className="
                      h-[95%] max-h-123 overflow-y-auto
                      pr-1
                      flex flex-col gap-0.5
                    "
                  >
                    {CATEGORIES.map((cat) => {
                      const isOpen = openCategoryId === cat.id;
                      const hasSubs = cat.subs && cat.subs.length > 0;

                      return (
                        <div key={cat.id} className="w-full">
                          {/* MAIN CATEGORY ROW */}
                          <button
                            onClick={() => {
                              if (hasSubs) {
                                toggleCategory(cat.id);
                              } else {
                                toggleCategory(cat.id);
                              }
                            }}
                            className={[
                              "w-full flex items-center justify-between",
                              "px-2 py-1 rounded-sm font-bold text-left",
                              "bg-white/15 hover:bg-white/10 border",
                              isOpen ? "border-blue-500" : "border-transparent",
                            ].join(" ")}
                          >
                            <span className="text-sm text-white">{cat.label}</span>

                            {/* plus/minus icon if subs exist */}
                            {hasSubs && (
                              <svg
                                width="20"
                                height="20"
                                fill="currentColor"
                                viewBox="0 0 16 16"
                                className="text-white/80 shrink-0"
                              >
                                {isOpen ? (
                                  <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8" />
                                ) : (
                                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                                )}
                              </svg>
                            )}
                          </button>

                          {/* SUBCATEGORIES */}
                          {isOpen && hasSubs && (
                            <div className="ml-2 flex flex-col">
                              {cat.subs!.map((sub) => (
                                <button
                                  key={sub.id}
                                  onClick={() => toggleSubCategory(sub.id)}
                                  className={[
                                    "w-full flex items-center justify-between",
                                    "px-2 py-1 rounded-sm font-bold text-left",
                                    "text-white text-sm",
                                    "border",
                                    openSubCategory === sub.id
                                      ? "border-blue-500 bg-[#787978] hover:bg-[#4f4f4f]"
                                      : "border-transparent bg-[#595a59] hover:bg-white/20",
                                  ].join(" ")}
                                >
                                  <span className="truncate">{sub.label}</span>
                                </button>
                              ))}
                            </div>
                          )
                          }
                        </div>
                      );
                    })}
                  </div>
                  {/* Items Display */}
                  <div className="px-2 grow">
                    <div
                      className="
                        max-h-117 overflow-y-auto pr-2
                        grid gap-3
                        grid-cols-1 sm:grid-cols-2
                      "
                    >
                      {itemsLoading ? (
                        <div className="col-span-full rounded-xl border border-white/10 bg-white/5 p-6 text-center text-white/70 text-sm">
                          Loading items…
                        </div>
                      ) : itemsError ? (
                        <div className="col-span-full rounded-xl border border-red-500/40 bg-red-900/30 p-6 text-center text-red-200 text-sm">
                          Failed to load items: {itemsError}
                        </div>
                      ) : filteredItems.length === 0 ? (
                        <div className="col-span-full rounded-xl border border-white/10 bg-white/5 p-6 text-center text-white/60">
                          No items match your search.
                        </div>
                      ) : (
                        filteredItems.map((item) => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            isFocused={itemInFocus === item.id}
                            onFocus={setItemInFocus}
                            onEquip={(it) => {
                              equipItemToFocusedSlot(it);
                            }}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={onCancel}
                    className="mx-3 my-5 rounded-md px-2 py-1.5 text-sm font-bold
                      bg-[#666666]/0 hover:bg-[#212121] text-white transition
                      border border-white/30
                    "
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={!canSave}
                    className={[
                      "px-4 py-2 text-sm",
                      canSave
                        ? " bg-[#0b4e97] hover:bg-[#2273c5]"
                        : " bg-blue-600/40 cursor-not-allowed",
                    ].join("mx-3 my-5 rounded-md px-4 py-1.5 font-bold text-white transition border border-white/30")}
                  >
                    {submitting ? "Saving…" : "Save Role"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div >
      )
      }
    </>
  );
}
