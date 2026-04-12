export const mockChildProfile = {
  user_id: 1,
  device_id: "device_001",
  role: "child",
  name: "Liam",
  age: 10,
  created_at: "2026-04-12T10:00:00Z",
};

export const mockParentProfile = {
  user_id: 2,
  device_id: "device_001",
  role: "parent",
  name: "Emma",
  age: 38,
  created_at: "2026-04-12T10:00:00Z",
};

export const mockParentChildRelation = {
  id: 1,
  parent_id: 2,
  child_id: 1,
};