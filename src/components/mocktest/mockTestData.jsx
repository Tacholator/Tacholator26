export const ASSESSMENT_CATEGORIES = [
  {
    category: "Eyesight Check",
    subcategories: ["Eyesight Check"]
  },
  {
    category: "Vehicle Safety Questions",
    subcategories: ["Tell Me Question", "Show Me Question"]
  },
  {
    category: "Move Off",
    subcategories: ["Safety", "Control"]
  },
  {
    category: "Use of Mirrors",
    subcategories: ["Before signalling", "Before changing direction", "Change of Speed"]
  },
  {
    category: "Signals",
    subcategories: ["Necessary", "Correctly given", "Timed correctly"]
  },
  {
    category: "Response to Signs and Signals",
    subcategories: ["Traffic signs", "Road markings", "Traffic lights", "Traffic controllers / police", "Other Road Users"]
  },
  {
    category: "Junctions",
    subcategories: ["Approach speed", "Observation", "Turning left", "Turning right", "Cutting corners"]
  },
  {
    category: "Positioning",
    subcategories: ["Normal driving", "Lane discipline"]
  },
  {
    category: "Progress",
    subcategories: ["Appropriate speed", "Undue hesitation"]
  },
  {
    category: "Pedestrian Crossings",
    subcategories: ["Pedestrian Crossings"]
  },
  {
    category: "Position / Normal Stops",
    subcategories: ["Position / Normal Stops"]
  },
  {
    category: "Awareness / Planning",
    subcategories: ["Awareness / Planning"]
  },
  {
    category: "Clearance",
    subcategories: ["Overtaking", "Passing parked vehicles / obstructions"]
  },
  {
    category: "Response to Other Road Users",
    subcategories: ["Pedestrians", "Cyclists", "Motorcyclists", "Other vehicles"]
  },
  {
    category: "Manoeuvres",
    subcategories: [
      "Reverse / Right - Control",
      "Reverse / Right - Observation",
      "Reverse Park (Road) - Control",
      "Reverse Park (Road) - Observation",
      "Reverse Park (Car Park) - Control",
      "Reverse Park (Car Park) - Observation",
      "Forward Park - Control",
      "Forward Park - Observation"
    ],
    manoeuvreGroups: [
      { name: "Reverse / Right", subs: ["Reverse / Right - Control", "Reverse / Right - Observation"] },
      { name: "Reverse Park (Road)", subs: ["Reverse Park (Road) - Control", "Reverse Park (Road) - Observation"] },
      { name: "Reverse Park (Car Park)", subs: ["Reverse Park (Car Park) - Control", "Reverse Park (Car Park) - Observation"] },
      { name: "Forward Park", subs: ["Forward Park - Control", "Forward Park - Observation"] }
    ]
  },
  {
    category: "Control",
    subcategories: [
      "Accelerator",
      "Footbrake",
      "Steering",
      "Gears",
      "Clutch",
      "Automatic vehicle control",
      "Parking brake / secure vehicle"
    ]
  },
  {
    category: "Controlled Stop / Emergency Stop",
    subcategories: ["Controlled Stop / Emergency Stop"]
  },
  {
    category: "Independent Driving",
    subcategories: ["Following sat nav", "Following traffic signs"]
  },
  {
    category: "Judgment",
    subcategories: ["Overtaking", "Meeting", "Crossing"]
  },
  {
    category: "Eco-safe / Smooth Driving",
    subcategories: ["Eco-safe / Smooth Driving"]
  }
];

export const RATINGS = [
  { value: "P", label: "P", title: "Pass", color: "bg-green-500 text-white", border: "border-green-500", text: "text-green-700", bg: "bg-green-50", score: 0 },
  { value: "DF", label: "DF", title: "Driver Fault", color: "bg-yellow-400 text-white", border: "border-yellow-400", text: "text-yellow-700", bg: "bg-yellow-50", score: 1 },
  { value: "S", label: "S", title: "Serious Fault", color: "bg-orange-500 text-white", border: "border-orange-500", text: "text-orange-700", bg: "bg-orange-50", score: 2 },
  { value: "D", label: "D", title: "Dangerous Fault", color: "bg-red-600 text-white", border: "border-red-600", text: "text-red-700", bg: "bg-red-50", score: 3 },
  { value: "NT", label: "NT", title: "Not Tested", color: "bg-slate-400 text-white", border: "border-slate-400", text: "text-slate-500", bg: "bg-slate-50", score: 0 }
];

export const QUICK_COMMENTS = [
  "Good mirror checks throughout",
  "Late mirror check before moving off",
  "Hesitated unnecessarily at junction",
  "Good positioning on approach to roundabout",
  "Steering control improving well",
  "Missed road marking",
  "Good awareness of pedestrians",
  "Speed slightly high on approach",
  "Good response to traffic signs",
  "Needs earlier planning at busy junctions",
  "Parallel park completed safely",
  "Lost accuracy during reverse manoeuvre",
  "Good independent drive overall",
  "Needs more confidence with lane discipline"
];

export const getRatingInfo = (value) => RATINGS.find(r => r.value === value) || RATINGS[4];

export const calculateTotals = (items) => {
  const df = items.filter(i => i.rating === "DF").reduce((sum, i) => sum + (i.faultCount || 1), 0);
  const s = items.filter(i => i.rating === "S").reduce((sum, i) => sum + (i.faultCount || 1), 0);
  const d = items.filter(i => i.rating === "D").reduce((sum, i) => sum + (i.faultCount || 1), 0);
  return { df, s, d };
};

export const calculateResult = (df, s, d) => {
  if (d > 0) return "Fail";
  if (s > 0) return "Fail";
  if (df <= 15) return "Pass";
  return "Needs More Practice";
};

export const isSubcategoryHidden = (subcategory, transmissionType) => {
  if (transmissionType === "Automatic") {
    return subcategory === "Gears" || subcategory === "Clutch";
  }
  if (transmissionType === "Manual") {
    return subcategory === "Automatic vehicle control";
  }
  return false;
};

export const buildInitialItems = (transmissionType = "Manual") => {
  const items = {};
  ASSESSMENT_CATEGORIES.forEach(cat => {
    cat.subcategories.forEach(sub => {
      if (!isSubcategoryHidden(sub, transmissionType)) {
        const key = `${cat.category}__${sub}`;
        items[key] = { category: cat.category, subcategory: sub, rating: "P", faultCount: 1, comments: "", improvementTag: "" };
      }
    });
  });
  return items;
};