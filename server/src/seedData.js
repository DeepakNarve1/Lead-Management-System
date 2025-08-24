import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Lead from "./models/Lead.js";
import sequelize from "./config/db.js";

const seedData = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log("Database synced successfully");

    // Create test user
    const hashedPassword = await bcrypt.hash("test123", 10);
    const testUser = await User.create({
      first_name: "Test",
      last_name: "User",
      email: "test@example.com",
      password: hashedPassword,
    });
    console.log("Test user created:", testUser.email);

    // Sample data for leads
    const sampleLeads = [
      {
        first_name: "John",
        last_name: "Smith",
        email: "john.smith@techcorp.com",
        phone: "+1-555-0101",
        company: "TechCorp Inc",
        city: "San Francisco",
        state: "CA",
        source: "website",
        status: "new",
        score: 85,
        lead_value: 50000,
        last_activity_at: new Date(),
        is_qualified: false,
        userId: testUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        first_name: "Sarah",
        last_name: "Johnson",
        email: "sarah.j@innovate.com",
        phone: "+1-555-0102",
        company: "Innovate Solutions",
        city: "New York",
        state: "NY",
        source: "google_ads",
        status: "contacted",
        score: 92,
        lead_value: 75000,
        last_activity_at: new Date(),
        is_qualified: true,
        userId: testUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        first_name: "Michael",
        last_name: "Brown",
        email: "michael.b@startup.io",
        phone: "+1-555-0103",
        company: "Startup.io",
        city: "Austin",
        state: "TX",
        source: "referral",
        status: "qualified",
        score: 78,
        lead_value: 100000,
        last_activity_at: new Date(),
        is_qualified: true,
        userId: testUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        first_name: "Emily",
        last_name: "Davis",
        email: "emily.d@enterprise.com",
        phone: "+1-555-0104",
        company: "Enterprise Corp",
        city: "Chicago",
        state: "IL",
        source: "facebook_ads",
        status: "won",
        score: 95,
        lead_value: 150000,
        last_activity_at: new Date(),
        is_qualified: true,
        userId: testUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        first_name: "David",
        last_name: "Wilson",
        email: "david.w@smallbiz.com",
        phone: "+1-555-0105",
        company: "Small Business LLC",
        city: "Denver",
        state: "CO",
        source: "events",
        status: "lost",
        score: 45,
        lead_value: 25000,
        last_activity_at: new Date(),
        is_qualified: false,
        userId: testUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Generate leads with varied data
    const sources = [
      "website",
      "facebook_ads",
      "google_ads",
      "referral",
      "events",
      "other",
    ];
    const statuses = ["new", "contacted", "qualified", "lost", "won"];
    const cities = [
      "San Francisco",
      "New York",
      "Austin",
      "Chicago",
      "Denver",
      "Seattle",
      "Boston",
      "Miami",
      "Los Angeles",
      "Portland",
    ];
    const states = ["CA", "NY", "TX", "IL", "CO", "WA", "MA", "FL", "CA", "OR"];
    const companies = [
      "TechCorp Inc",
      "Innovate Solutions",
      "Startup.io",
      "Enterprise Corp",
      "Small Business LLC",
      "Digital Dynamics",
      "Cloud Systems",
      "Data Analytics Co",
      "Mobile Apps Inc",
      "AI Solutions",
    ];

    for (let i = 6; i <= 105; i++) {
      const randomSource = sources[Math.floor(Math.random() * sources.length)];
      const randomStatus =
        statuses[Math.floor(Math.random() * statuses.length)];
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      const randomState = states[Math.floor(Math.random() * states.length)];
      const randomCompany =
        companies[Math.floor(Math.random() * companies.length)];
      const randomScore = Math.floor(Math.random() * 101);
      const randomValue = Math.floor(Math.random() * 200000) + 10000;
      const randomQualified = randomScore > 70;

      sampleLeads.push({
        first_name: `User${i}`,
        last_name: `Last${i}`,
        email: `user${i}@example${i}.com`,
        phone: `+1-555-${String(i).padStart(4, "0")}`,
        company: randomCompany,
        city: randomCity,
        state: randomState,
        source: randomSource,
        status: randomStatus,
        score: randomScore,
        lead_value: randomValue,
        last_activity_at: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ),
        is_qualified: randomQualified,
        userId: testUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Create all leads
    await Lead.bulkCreate(sampleLeads);
    console.log(`Created ${sampleLeads.length} leads`);

    console.log("Seed data completed successfully!");
    console.log("Test user credentials:");
    console.log("Email: test@example.com");
    console.log("Password: test123");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seedData();
