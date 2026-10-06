import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.trekSchedule.deleteMany();
  await prisma.trek.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash("admin123", salt);
  const guidePassword = await bcrypt.hash("guide123", salt);
  const userPassword = await bcrypt.hash("user123", salt);

  const admin = await prisma.user.create({
    data: {
      name: "Expedition Administrator",
      email: "admin@trek.com",
      password: adminPassword,
      role: "ADMIN",
      phone: "+91 9876543210",
      bio: "Chief Operations Coordinator for Western Ghats and Himalayan Expeditions.",
    },
  });

  const guide1 = await prisma.user.create({
    data: {
      name: "Ramesh Sharma",
      email: "ramesh@trek.com",
      password: guidePassword,
      role: "GUIDE",
      phone: "+91 9811223344",
      bio: "Certified mountaineer with 8+ years leading Western Ghats trails. Wilderness First Responder.",
      emergencyContact: "+91 9811223399",
    },
  });

  const guide2 = await prisma.user.create({
    data: {
      name: "Anita Deshmukh",
      email: "anita@trek.com",
      password: guidePassword,
      role: "GUIDE",
      phone: "+91 9822334455",
      bio: "Sahyadri trails specialist, nature photographer, and certified high-altitude trek leader.",
      emergencyContact: "+91 9822334499",
    },
  });

  const guide3 = await prisma.user.create({
    data: {
      name: "Suresh Kumar",
      email: "suresh@trek.com",
      password: guidePassword,
      role: "GUIDE",
      phone: "+91 9833445566",
      bio: "High altitude trek leader with over 50 successful summits across Karnataka and Kerala.",
      emergencyContact: "+91 9833445599",
    },
  });

  const user1 = await prisma.user.create({
    data: {
      name: "Rahul Verma",
      email: "rahul@gmail.com",
      password: userPassword,
      role: "USER",
      phone: "+91 9123456780",
      age: 26,
      bio: "Weekend trekker and landscape photography enthusiast.",
      emergencyContact: "+91 9123456789",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Priya Nair",
      email: "priya@gmail.com",
      password: userPassword,
      role: "USER",
      phone: "+91 9234567891",
      age: 24,
      bio: "Trail runner and nature explorer.",
      emergencyContact: "+91 9234567899",
    },
  });

  const kudremukhItineraries = {
    1: [
      {
        day: 1,
        title: "Express Summit Challenge",
        desc: "Mullodi Base Checkpost → Forest Office Permit Check → Ontimara Single Tree → Kudremukh Horse-face Peak → Return to Mullodi.",
      },
    ],
    2: [
      {
        day: 1,
        title: "Base Camp Arrival & Forest Exploration",
        desc: "Report at Mullodi base camp by 4:00 PM. Orientation briefing, Somavathi falls walk, dinner, and tent allotment.",
      },
      {
        day: 2,
        title: "Kudremukh Summit Push & Descent",
        desc: "Start 6:00 AM after permit clearance. Traverse shola grasslands, reach summit peak by 11:30 AM, descend to base by 5:00 PM.",
      },
    ],
    3: [
      {
        day: 1,
        title: "Base Camp & Shola Acclimatization",
        desc: "Arrival at Mullodi, stream hike, gear check, and campfire orientation.",
      },
      {
        day: 2,
        title: "Kudremukh Peak Expedition",
        desc: "Full day trek to Kudremukh Peak with packed lunch and photography stops.",
      },
      {
        day: 3,
        title: "Somawathi Waterfalls & Village Walk",
        desc: "Morning hike to Somavathi falls, local Malnad breakfast, and return journey.",
      },
    ],
  };

  const skandagiriItineraries = {
    1: [
      {
        day: 1,
        title: "Midnight Ascent & Sunrise Above Clouds",
        desc: "Assemble at Papagni Temple Base (Kalavara) at 2:30 AM → Climb ancient stone path → Reach fort ruins by 5:30 AM → Sunrise spectacle → Descend by 8:30 AM.",
      },
    ],
    2: [
      {
        day: 1,
        title: "Night Stargazing & Base Camp Briefing",
        desc: "Arrive at Kalavara base village at 9:00 PM. Safety check, star gazing, and rest before ascent.",
      },
      {
        day: 2,
        title: "Sunrise Peak Trek & Heritage Fort",
        desc: "Climb to Skandagiri summit for sunrise over the clouds. Explore fort walls and descend for South Indian breakfast.",
      },
    ],
  };

  const kumaraItineraries = {
    2: [
      {
        day: 1,
        title: "Subramanya to Bhattara Mane Camp",
        desc: "Start 7:00 AM from Kukke Subramanya Temple. 7 km steep ascent through rainforests to forest rest house Bhattara Mane. Camp overnight.",
      },
      {
        day: 2,
        title: "Summit Assault to Pushpagiri & Full Descent",
        desc: "Early 4:30 AM push past Kallu Mandapa, Shesha Parvatha, and Kumara Parvatha summit. Descend back to Kukke by 6:00 PM.",
      },
    ],
    3: [
      {
        day: 1,
        title: "Base Arrival & Forest Camp",
        desc: "Kukke Subramanya arrival, equipment distribution, and trek to Bhattara Mane.",
      },
      {
        day: 2,
        title: "Kumara Parvatha & Shesha Parvatha",
        desc: "Summit ascent to 1,712m peak with extensive valley exploration.",
      },
      {
        day: 3,
        title: "Descent & Temple Visit",
        desc: "Leisurely descent back to Kukke Subramanya town.",
      },
    ],
  };

  const tadiandamolItineraries = {
    1: [
      {
        day: 1,
        title: "Day Hike to Highest Peak of Coorg",
        desc: "Nalknad Palace Trailhead → Big Rock Viewpoint → False Peak Ridge → Tadiandamol Summit (1,748m) → Packed lunch → Descent.",
      },
    ],
    2: [
      {
        day: 1,
        title: "Coffee Plantation Stay & Base Camp",
        desc: "Arrive in Coorg homestay, plantation walk, and route briefing.",
      },
      {
        day: 2,
        title: "Tadiandamol Peak Summit & Chelavara Falls",
        desc: "Early morning hike to summit and post-trek visit to Chelavara falls.",
      },
    ],
  };

  const kodachadriItineraries = {
    1: [
      {
        day: 1,
        title: "Hidlumane Waterfall & Peak Climb",
        desc: "Start Kattinahole Base → Hidlumane Waterfalls rock trail → Grassland ridge → Sarvajna Peetha Peak → Jeep descent.",
      },
    ],
    2: [
      {
        day: 1,
        title: "Waterfall Trek to Kodachadri Peak",
        desc: "Ascend via Hidlumane falls cascades. Sunset at Shankara Peetha. Homestay dinner.",
      },
      {
        day: 2,
        title: "Ancient Fort & Nagara Visit",
        desc: "Morning views of Arabian sea coastline mist and visit to Nagara Fort ruins.",
      },
    ],
  };

  const mullayanagiriItineraries = {
    1: [
      {
        day: 1,
        title: "Highest Summit of Karnataka Day Trail",
        desc: "Sarpadhari Trailhead → Cave Point → Mullayanagiri Temple Summit (1,930m) → Ridge walk towards Baba Budangiri.",
      },
    ],
    2: [
      {
        day: 1,
        title: "Chikkamagaluru Ridge Expedition",
        desc: "Traverse the full serpentine ridge connecting Mullayanagiri and Baba Budangiri with overnight estate camp.",
      },
      {
        day: 2,
        title: "Manikyadhara Falls & Coffee Trail",
        desc: "Visit Manikyadhara waterfalls and return journey.",
      },
    ],
  };

  const trek1 = await prisma.trek.create({
    data: {
      name: "Kudremukh Peak Trek",
      slug: "kudremukh-peak-trek",
      location: "Chikkamagaluru",
      state: "Karnataka",
      description: "Trek through the rolling green meadows and dense shola forests of Kudremukh National Park. Famous for its distinctive horse-face mountain peak and mist-covered valleys.",
      difficulty: "MODERATE",
      distance: 22,
      availableDurations: [1, 2, 3],
      basePricePerDay: 1650,
      maxParticipants: 25,
      meetingPoint: "Mullodi Village Forest Checkpost",
      destination: "Kudremukh Peak Summit (1,894m)",
      elevation: 1894,
      checkpoints: JSON.stringify([
        "Mullodi Base Camp",
        "Forest Checkpost",
        "Ontimara Single Tree",
        "Lobo House Ruin",
        "Kudremukh Peak Summit",
      ]),
      itineraries: JSON.stringify(kudremukhItineraries),
      requirements: JSON.stringify([
        "Sturdy Trekking Boots with deep lugs",
        "2L Reusable Water Bottles",
        "Raincoat / Poncho",
        "Headlamp / Torch with extra batteries",
        "Quick-dry hiking clothes",
        "Government ID Proof (Required for Forest Permit)",
      ]),
      images: [
        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop",
      ],
      imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop",
      status: "ACTIVE",
      startLat: 13.2215,
      startLng: 75.2536,
      destLat: 13.1292,
      destLng: 75.2758,
      guideId: guide1.id,
    },
  });

  const trek2 = await prisma.trek.create({
    data: {
      name: "Skandagiri Sunrise Night Trek",
      slug: "skandagiri-sunrise-night-trek",
      location: "Chikkaballapur",
      state: "Karnataka",
      description: "An exhilarating midnight climb under starlight leading to a breathtaking sunrise above a cloud blanket and historic hilltop fort ruins.",
      difficulty: "EASY",
      distance: 8,
      availableDurations: [1, 2],
      basePricePerDay: 1250,
      maxParticipants: 30,
      meetingPoint: "Papagni Temple Base, Kalavara",
      destination: "Skandagiri Fort Summit (1,450m)",
      elevation: 1450,
      checkpoints: JSON.stringify([
        "Kalavara Papagni Temple",
        "Forest Entry Gate",
        "Middle Fort Bastion",
        "Skandagiri Summit Viewpoint",
      ]),
      itineraries: JSON.stringify(skandagiriItineraries),
      requirements: JSON.stringify([
        "Headlamp or Torch (Mandatory for night hike)",
        "Trekking Shoes",
        "Windcheater / Warm Jacket for summit cold",
        "1.5L Hydration Water",
        "Energy bars and electrolytes",
      ]),
      images: [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop",
      ],
      imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop",
      status: "ACTIVE",
      startLat: 13.4184,
      startLng: 77.6834,
      destLat: 13.4215,
      destLng: 77.6865,
      guideId: guide2.id,
    },
  });

  const trek3 = await prisma.trek.create({
    data: {
      name: "Kumara Parvatha Challenge",
      slug: "kumara-parvatha-challenge",
      location: "Pushpagiri, Somwarpet",
      state: "Karnataka",
      description: "The supreme trekking challenge of the Western Ghats. Scale steep volcanic boulder ridges, bamboo forests, and Shesha Parvatha to reach Pushpagiri summit.",
      difficulty: "DIFFICULT",
      distance: 28,
      availableDurations: [2, 3],
      basePricePerDay: 1950,
      maxParticipants: 20,
      meetingPoint: "Kukke Subramanya Temple Base",
      destination: "Kumara Parvatha Peak (1,712m)",
      elevation: 1712,
      checkpoints: JSON.stringify([
        "Kukke Subramanya Trailhead",
        "Bhattara Mane Camp",
        "Forest Checkpoint",
        "Kallu Mandapa",
        "Shesha Parvatha Peak",
        "Kumara Parvatha Summit",
      ]),
      itineraries: JSON.stringify(kumaraItineraries),
      requirements: JSON.stringify([
        "High-ankle Trekking Boots",
        "3L Water Reservoir / Hydration Bladder",
        "Trekking Pole",
        "Electrolytes / ORS",
        "Warm fleece layer",
        "First aid & blister tape",
      ]),
      images: [
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop",
      ],
      imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop",
      status: "ACTIVE",
      startLat: 12.6784,
      startLng: 75.6174,
      destLat: 12.6659,
      destLng: 75.6806,
      guideId: guide3.id,
    },
  });

  const trek4 = await prisma.trek.create({
    data: {
      name: "Tadiandamol Peak Trek",
      slug: "tadiandamol-peak-trek",
      location: "Coorg (Kodagu)",
      state: "Karnataka",
      description: "Ascend the highest summit in Kodagu district through aromatic coffee plantations, gushing streams, and broad grassy ridges.",
      difficulty: "EASY",
      distance: 14,
      availableDurations: [1, 2],
      basePricePerDay: 1400,
      maxParticipants: 25,
      meetingPoint: "Nalknad Palace Base",
      destination: "Tadiandamol Summit (1,748m)",
      elevation: 1748,
      checkpoints: JSON.stringify([
        "Nalknad Palace Trailhead",
        "Big Rock Viewpoint",
        "False Peak Ridge",
        "Tadiandamol Summit",
      ]),
      itineraries: JSON.stringify(tadiandamolItineraries),
      requirements: JSON.stringify([
        "Sports / Trekking Shoes",
        "2L Water Bottle",
        "Sun protection cap",
        "Light windcheater",
      ]),
      images: [
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
      ],
      imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
      status: "ACTIVE",
      startLat: 12.2154,
      startLng: 75.6421,
      destLat: 12.2185,
      destLng: 75.6083,
      guideId: guide3.id,
    },
  });

  const trek5 = await prisma.trek.create({
    data: {
      name: "Kodachadri Peak & Waterfall Trail",
      slug: "kodachadri-peak-and-waterfall-trail",
      location: "Shimoga",
      state: "Karnataka",
      description: "A heritage rainforest trail featuring multi-tier Hidlumane waterfalls, steep rock trails, and the ancient Sarvajna Peetha temple.",
      difficulty: "MODERATE",
      distance: 16,
      availableDurations: [1, 2],
      basePricePerDay: 1600,
      maxParticipants: 25,
      meetingPoint: "Kattinahole Base",
      destination: "Sarvajna Peetha Peak (1,343m)",
      elevation: 1343,
      checkpoints: JSON.stringify([
        "Kattinahole Village",
        "Hidlumane Waterfalls",
        "Grassland Ridge",
        "Shankara Peetha Peak",
      ]),
      itineraries: JSON.stringify(kodachadriItineraries),
      requirements: JSON.stringify([
        "Waterproof Trekking Shoes",
        "Raincoat / Poncho",
        "Change of clothes",
        "2L Water Bottle",
      ]),
      images: [
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop",
      ],
      imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop",
      status: "ACTIVE",
      startLat: 13.8562,
      startLng: 74.8724,
      destLat: 13.8541,
      destLng: 74.8711,
      guideId: guide2.id,
    },
  });

  const trek6 = await prisma.trek.create({
    data: {
      name: "Mullayanagiri Peak & Ridge",
      slug: "mullayanagiri-peak-and-ridge",
      location: "Chikkamagaluru",
      state: "Karnataka",
      description: "Scale Karnataka's highest peak at 1,930 meters and traverse panoramic coffee valley ridges connecting to Baba Budangiri.",
      difficulty: "MODERATE",
      distance: 12,
      availableDurations: [1, 2],
      basePricePerDay: 1350,
      maxParticipants: 25,
      meetingPoint: "Sarpadhari Trailhead",
      destination: "Mullayanagiri Temple Peak (1,930m)",
      elevation: 1930,
      checkpoints: JSON.stringify([
        "Sarpadhari Base",
        "Cave Point",
        "Mullayanagiri Temple Summit",
        "Baba Budangiri Ridge",
      ]),
      itineraries: JSON.stringify(mullayanagiriItineraries),
      requirements: JSON.stringify([
        "Trekking Shoes",
        "Windcheater jacket",
        "2L Water",
        "Sunglasses & cap",
      ]),
      images: [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
      ],
      imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
      status: "ACTIVE",
      startLat: 13.3912,
      startLng: 75.7214,
      destLat: 13.3915,
      destLng: 75.7219,
      guideId: guide1.id,
    },
  });

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  const schedules = [
    {
      trekId: trek1.id,
      duration: 2,
      startDate: new Date(now.getTime() + 4 * dayMs),
      endDate: new Date(now.getTime() + 6 * dayMs),
      capacity: 25,
      bookedParticipants: 8,
      guideId: guide1.id,
      status: "OPEN",
    },
    {
      trekId: trek1.id,
      duration: 1,
      startDate: new Date(now.getTime() + 8 * dayMs),
      endDate: new Date(now.getTime() + 9 * dayMs),
      capacity: 20,
      bookedParticipants: 18,
      guideId: guide1.id,
      status: "OPEN",
    },
    {
      trekId: trek1.id,
      duration: 3,
      startDate: new Date(now.getTime() + 14 * dayMs),
      endDate: new Date(now.getTime() + 17 * dayMs),
      capacity: 20,
      bookedParticipants: 20,
      guideId: guide1.id,
      status: "FULL",
    },
    {
      trekId: trek2.id,
      duration: 1,
      startDate: new Date(now.getTime() + 2 * dayMs),
      endDate: new Date(now.getTime() + 3 * dayMs),
      capacity: 30,
      bookedParticipants: 12,
      guideId: guide2.id,
      status: "OPEN",
    },
    {
      trekId: trek2.id,
      duration: 1,
      startDate: new Date(now.getTime() + 5 * dayMs),
      endDate: new Date(now.getTime() + 6 * dayMs),
      capacity: 30,
      bookedParticipants: 5,
      guideId: guide2.id,
      status: "OPEN",
    },
    {
      trekId: trek2.id,
      duration: 2,
      startDate: new Date(now.getTime() + 10 * dayMs),
      endDate: new Date(now.getTime() + 12 * dayMs),
      capacity: 25,
      bookedParticipants: 0,
      guideId: guide2.id,
      status: "OPEN",
    },
    {
      trekId: trek3.id,
      duration: 2,
      startDate: new Date(now.getTime() + 7 * dayMs),
      endDate: new Date(now.getTime() + 9 * dayMs),
      capacity: 20,
      bookedParticipants: 6,
      guideId: guide3.id,
      status: "OPEN",
    },
    {
      trekId: trek3.id,
      duration: 3,
      startDate: new Date(now.getTime() + 18 * dayMs),
      endDate: new Date(now.getTime() + 21 * dayMs),
      capacity: 15,
      bookedParticipants: 4,
      guideId: guide3.id,
      status: "OPEN",
    },
    {
      trekId: trek4.id,
      duration: 1,
      startDate: new Date(now.getTime() + 3 * dayMs),
      endDate: new Date(now.getTime() + 4 * dayMs),
      capacity: 25,
      bookedParticipants: 10,
      guideId: guide3.id,
      status: "OPEN",
    },
    {
      trekId: trek4.id,
      duration: 2,
      startDate: new Date(now.getTime() + 11 * dayMs),
      endDate: new Date(now.getTime() + 13 * dayMs),
      capacity: 25,
      bookedParticipants: 3,
      guideId: guide3.id,
      status: "OPEN",
    },
    {
      trekId: trek5.id,
      duration: 2,
      startDate: new Date(now.getTime() + 16 * dayMs),
      endDate: new Date(now.getTime() + 18 * dayMs),
      capacity: 20,
      bookedParticipants: 2,
      guideId: guide2.id,
      status: "OPEN",
    },
    {
      trekId: trek5.id,
      duration: 1,
      startDate: new Date(now.getTime() + 22 * dayMs),
      endDate: new Date(now.getTime() + 23 * dayMs),
      capacity: 25,
      bookedParticipants: 7,
      guideId: guide2.id,
      status: "OPEN",
    },
    {
      trekId: trek6.id,
      duration: 2,
      startDate: new Date(now.getTime() + 20 * dayMs),
      endDate: new Date(now.getTime() + 22 * dayMs),
      capacity: 25,
      bookedParticipants: 14,
      guideId: guide1.id,
      status: "OPEN",
    },
    {
      trekId: trek6.id,
      duration: 1,
      startDate: new Date(now.getTime() + 26 * dayMs),
      endDate: new Date(now.getTime() + 27 * dayMs),
      capacity: 25,
      bookedParticipants: 25,
      guideId: guide1.id,
      status: "FULL",
    },
  ];

  for (const s of schedules) {
    await prisma.trekSchedule.create({ data: s });
  }

  const pastSchedule = await prisma.trekSchedule.create({
    data: {
      trekId: trek1.id,
      duration: 2,
      startDate: new Date(now.getTime() - 10 * dayMs),
      endDate: new Date(now.getTime() - 8 * dayMs),
      capacity: 25,
      bookedParticipants: 15,
      guideId: guide1.id,
      status: "COMPLETED",
    },
  });

  const pastBooking = await prisma.booking.create({
    data: {
      bookingId: "TRK-82931",
      userId: user1.id,
      trekId: trek1.id,
      scheduleId: pastSchedule.id,
      startDate: pastSchedule.startDate,
      endDate: pastSchedule.endDate,
      duration: 2,
      participants: 2,
      participantDetails: JSON.stringify([
        {
          fullName: "Rahul Verma",
          age: 26,
          phone: "+91 9123456780",
          emergencyName: "Suresh Verma",
          emergencyPhone: "+91 9123456789",
        },
        {
          fullName: "Aman Gupta",
          age: 27,
          phone: "+91 9123456788",
          emergencyName: "Suresh Verma",
          emergencyPhone: "+91 9123456789",
        },
      ]),
      totalAmount: 6600,
      paymentStatus: "PAID",
      bookingStatus: "COMPLETED",
    },
  });

  await prisma.review.create({
    data: {
      userId: user1.id,
      trekId: trek1.id,
      rating: 5,
      comment: "Incredible 2-day experience! The guide Ramesh managed our pace perfectly through the shola forests. The horse-face peak view above the clouds was worth every step.",
      createdAt: new Date(now.getTime() - 7 * dayMs),
    },
  });

  await prisma.notification.create({
    data: {
      userId: user1.id,
      title: "Expedition Completed",
      message: "Congratulations on completing the Kudremukh Peak Trek! Share your review to help fellow trekkers.",
      type: "BOOKING",
      isRead: true,
    },
  });

  console.log("MongoDB Database seeded successfully with real multi-duration treks, schedules, and verified accounts.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
