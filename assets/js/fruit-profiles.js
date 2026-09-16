export const FRUIT_PROFILES = [
  { key: "orange", emoji: "🍊", name: "ส้มใจดี" },
  { key: "apple", emoji: "🍎", name: "แอปเปิลสดใส" },
  { key: "grape", emoji: "🍇", name: "องุ่นใจเย็น" },
  { key: "watermelon", emoji: "🍉", name: "แตงโมสบายใจ" },
  { key: "strawberry", emoji: "🍓", name: "สตรอว์เบอร์รีอ่อนโยน" },
  { key: "lemon", emoji: "🍋", name: "เลมอนร่าเริง" }
];

export function fruitProfile(key) {
  return FRUIT_PROFILES.find(item => item.key === key) || FRUIT_PROFILES[0];
}
