const frameAsset = (slotCount, frameNumber = 1) => `/frames/Frame_${slotCount}_${frameNumber}.png`

export const templates = [
  // --- PHOTOSTRIP CATEGORY ---
  {
    id: "strip-3",
    category: "PHOTOSTRIP",
    name: "chess 3 Strip",
    description: "3 vertical photos",
    image: frameAsset(3, 1),
    canvas: { width: 1181, height: 3543 },
    slots: [
      { id: "photo-1", x: 160, y: 285, width: 865, height: 600 },
      { id: "photo-2", x: 160, y: 1085, width: 865, height: 600 },
      { id: "photo-3", x: 160, y: 1885, width: 865, height: 600 }
    ]
  },
  {
    id: "strip-4",
    category: "PHOTOSTRIP",
    name: "lucu ",
    description: "3 vertical photos",
    image: frameAsset(3, 2),
    canvas: { width: 1181, height: 3543 },
    slots: [
      { id: "photo-1", x: 160, y: 285, width: 865, height: 600 },
      { id: "photo-2", x: 160, y: 1085, width: 865, height: 600 },
      { id: "photo-3", x: 160, y: 1885, width: 865, height: 600 }
    ]
  },
    {
    id: "strip-5",
    category: "PHOTOSTRIP",
    name: "Heart 3 Strip",
    description: "3 vertical photos",
    image: frameAsset(3, 3),
    canvas: { width: 1181, height: 3543 },
    slots: [
      { id: "photo-1", x: 160, y: 285, width: 865, height: 600 },
      { id: "photo-2", x: 160, y: 1085, width: 865, height: 600 },
      { id: "photo-3", x: 160, y: 1885, width: 865, height: 600 }
    ]
  },
  {
    id: "strip-6",
    category: "PHOTOSTRIP",
    name: "Brown 3 Strip",
    description: "3 vertical photos",
    image: frameAsset(3, 4),
    canvas: { width: 1181, height: 3543 },
    slots: [
      { id: "photo-1", x: 160, y: 285, width: 865, height: 600 },
      { id: "photo-2", x: 160, y: 1085, width: 865, height: 600 },
      { id: "photo-3", x: 160, y: 1885, width: 865, height: 600 }
    ]
  },
    {
    id: "strip-7",
    category: "PHOTOSTRIP",
    name: "Coquette 3 Strip",
    description: "3 vertical photos",
    image: frameAsset(3, 5),
    canvas: { width: 1181, height: 3543 },
    slots: [
      { id: "photo-1", x: 160, y: 285, width: 865, height: 600 },
      { id: "photo-2", x: 160, y: 1085, width: 865, height: 600 },
      { id: "photo-3", x: 160, y: 1885, width: 865, height: 600 }
    ]
  },
];