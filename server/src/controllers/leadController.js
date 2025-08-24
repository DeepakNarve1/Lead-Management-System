import Lead from "../models/Lead.js";
import { Op } from "sequelize";

export const createLead = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      company,
      city,
      state,
      source,
      status,
      score,
      lead_value,
      last_activity_at,
      is_qualified,
    } = req.body;

    if (!first_name || !last_name || !email || !source) {
      return res.status(400).json({
        message: "First name, last name, email and source are required",
      });
    }

    const lead = await Lead.create({
      first_name,
      last_name,
      email,
      phone,
      company,
      city,
      state,
      source,
      status,
      score,
      lead_value,
      last_activity_at,
      is_qualified,
      userId: req.user.id,
    });
    res.status(201).json(lead);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get all leads with pagination and filtering
export const getLeads = async (req, res) => {
  try {
    console.log("Getting leads with query params:", req.query);

    const {
      page = 1,
      limit = 20,
      search,
      q,
      first_name,
      last_name,
      email,
      company,
      city,
      state,
      source,
      status,
      score_min,
      score_max,
      lead_value_min,
      lead_value_max,
      is_qualified,
      created_after,
      created_before,
      last_activity_after,
      last_activity_before,
    } = req.query;

    // Validate pagination
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause = { userId: req.user.id };
    const filters = {};

    // General search across multiple fields
    if (search || q) {
      const searchTerm = search || q;
      console.log("Applying general search for term:", searchTerm);

      // Split search term into individual words
      const searchWords = searchTerm
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);
      console.log("Search words:", searchWords);

      if (searchWords.length > 1) {
        // Multiple words: search for leads that contain ALL words
        const wordConditions = searchWords.map((word) => ({
          [Op.or]: [
            { first_name: { [Op.iLike]: `%${word}%` } },
            { last_name: { [Op.iLike]: `%${word}%` } },
            { email: { [Op.iLike]: `%${word}%` } },
            { company: { [Op.iLike]: `%${word}%` } },
            { city: { [Op.iLike]: `%${word}%` } },
            { state: { [Op.iLike]: `%${word}%` } },
          ],
        }));

        // Use AND logic to ensure ALL words are found
        filters[Op.and] = wordConditions;
      } else {
        // Single word: search across all fields
        filters[Op.or] = [
          { first_name: { [Op.iLike]: `%${searchTerm}%` } },
          { last_name: { [Op.iLike]: `%${searchTerm}%` } },
          { email: { [Op.iLike]: `%${searchTerm}%` } },
          { company: { [Op.iLike]: `%${searchTerm}%` } },
          { city: { [Op.iLike]: `%${searchTerm}%` } },
          { state: { [Op.iLike]: `%${searchTerm}%` } },
        ];
      }
    } else {
      // Individual field filters
      if (first_name) filters.first_name = { [Op.iLike]: `%${first_name}%` };
      if (last_name) filters.last_name = { [Op.iLike]: `%${last_name}%` };
      if (email) filters.email = { [Op.iLike]: `%${email}%` };
      if (company) filters.company = { [Op.iLike]: `%${company}%` };
      if (city) filters.city = { [Op.iLike]: `%${city}%` };
      if (state) filters.state = { [Op.iLike]: `%${state}%` };
    }

    // Enum filters
    if (source) filters.source = source;
    if (status) filters.status = status;
    if (is_qualified !== undefined)
      filters.is_qualified = is_qualified === "true";

    // Number filters
    if (score_min || score_max) {
      filters.score = {};
      if (score_min) filters.score[Op.gte] = parseInt(score_min);
      if (score_max) filters.score[Op.lte] = parseInt(score_max);
    }

    if (lead_value_min || lead_value_max) {
      filters.lead_value = {};
      if (lead_value_min)
        filters.lead_value[Op.gte] = parseFloat(lead_value_min);
      if (lead_value_max)
        filters.lead_value[Op.lte] = parseFloat(lead_value_max);
    }

    // Date filters
    if (created_after || created_before) {
      filters.createdAt = {};
      if (created_after) filters.createdAt[Op.gte] = new Date(created_after);
      if (created_before) filters.createdAt[Op.lte] = new Date(created_before);
    }

    if (last_activity_after || last_activity_before) {
      filters.last_activity_at = {};
      if (last_activity_after)
        filters.last_activity_at[Op.gte] = new Date(last_activity_after);
      if (last_activity_before)
        filters.last_activity_at[Op.lte] = new Date(last_activity_before);
    }

    // Apply filters
    Object.assign(whereClause, filters);

    console.log("Final where clause:", JSON.stringify(whereClause, null, 2));

    // Get total count
    const total = await Lead.count({ where: whereClause });

    // Get leads with pagination
    const leads = await Lead.findAll({
      where: whereClause,
      limit: limitNum,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(total / limitNum);

    console.log(`Found ${leads.length} leads out of ${total} total`);

    // Debug: Check the first lead's timestamps
    if (leads.length > 0) {
      const firstLead = leads[0];
      console.log("First lead timestamps:", {
        id: firstLead.id,
        createdAt: firstLead.createdAt,
        updatedAt: firstLead.updatedAt,
        created_at: firstLead.created_at,
        updated_at: firstLead.updated_at,
        rawData: firstLead.toJSON(),
      });
    }

    res.status(200).json({
      data: leads,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("Error getting leads:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get lead by ID
export const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    res.status(200).json(lead);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateLead = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      company,
      city,
      state,
      source,
      status,
      score,
      lead_value,
      last_activity_at,
      is_qualified,
    } = req.body;

    const lead = await Lead.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== lead.email) {
      const existingLead = await Lead.findOne({
        where: {
          email,
          id: { [Op.ne]: req.params.id },
        },
      });
      if (existingLead) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    await lead.update({
      first_name,
      last_name,
      email,
      phone,
      company,
      city,
      state,
      source,
      status,
      score,
      lead_value,
      last_activity_at,
      is_qualified,
    });

    res.status(200).json(lead);
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Delete lead
export const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!lead) return res.status(404).json({ message: "Lead not found" });

    await lead.destroy();
    res.json({ message: "Lead deleted successfully" });
  } catch (error) {
    console.error("Error deleting lead:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
