const Groq = require('groq-sdk');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const Worker = require('../models/Worker');

const MODEL = 'llama-3.3-70b-versatile'; // Fast & capable model

/**
 * Get Groq client — lazy-initialized so the module loads without crashing
 * if GROQ_API_KEY isn't set yet (e.g., during syntax checks).
 */
let _groq = null;
const getGroq = () => {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
};

const fallbackDesignIdeas = ({ prompt, metalType, style, occasion }) => {
  const metal = metalType || 'Gold or Silver';
  const designStyle = style || 'contemporary Indian';
  const useCase = occasion || 'daily and occasion wear';

  return `Groq is currently unavailable, so here is a practical fallback concept set:

1. Signature ${metal} ${designStyle} piece
- Concept: Build around "${prompt}" with a balanced central motif, clean edges, and wearable proportions for ${useCase}.
- Materials: ${metal} with small accent stones such as cubic zirconia, pearls, or colored gemstones based on budget.
- Techniques: CAD sketching, casting for the base form, hand finishing, polishing, and final quality inspection.
- Cost note: Estimate metal cost from final gram weight, then add 12-18% making charges for simpler work or 20-28% for detailed stone setting.

2. Lightweight production-friendly variant
- Concept: Keep the same visual theme but reduce metal weight with openwork, filigree-inspired gaps, or a hollow-backed construction.
- Materials: Use lower stone count and repeatable components so the workshop can produce it consistently.
- Techniques: Wax model, casting, soldered details, stone setting only at focal points, and rhodium/polish if needed.
- Target customer: Buyers who want a premium look with controlled manufacturing cost.

3. Premium custom variant
- Concept: Add personalization such as initials, birthstones, meenakari-style color, or a detachable pendant/charm.
- Materials: Higher purity metal or premium stones for the focal area.
- Techniques: Hand engraving, precise stone setting, and final QC photos before delivery.
- Target customer: Bridal, festive, or gift orders where uniqueness matters.`;
};

const fallbackChatReply = ({ message, orders = [], inventory = [], workers = [] }) => {
  const pending = orders.filter((o) => o.status === 'Pending').length;
  const inProgress = orders.filter((o) => o.status === 'In Progress').length;
  const overdue = orders.filter(
    (o) => new Date(o.dueDate) < new Date() && !['Completed', 'Cancelled'].includes(o.status)
  ).length;
  const lowStock = inventory.filter((i) => i.quantity <= i.minStockLevel).length;
  const available = workers.filter((w) => w.status === 'Available').length;

  return `Groq is currently unavailable, but I checked the live database summary for your question: "${message}".

Current snapshot:
- Orders: ${orders.length} total, ${pending} pending, ${inProgress} in progress, ${overdue} overdue.
- Inventory: ${inventory.length} items, ${lowStock} low-stock alerts.
- Workers: ${workers.length} total, ${available} available.

Recommended next step: prioritize overdue orders first, then match pending high-priority work to available workers and restock low-stock materials before accepting similar new orders.`;
};

/**
 * @route   POST /api/ai/design
 * @desc    Generate jewellery design ideas using AI
 * @access  Private
 */
const generateDesign = async (req, res, next) => {
  try {
    const { prompt, metalType, style, occasion } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const systemPrompt = `You are an expert jewellery designer with 20+ years of experience in gold, silver, and platinum jewellery. 
You specialize in traditional Indian, contemporary, and fusion jewellery design.
When given a prompt, provide detailed, actionable design ideas including:
- Design concept and aesthetic
- Metal and stone recommendations
- Crafting techniques
- Approximate making charges
- Target market
Keep responses structured and practical.`;

    const userMessage = `Design prompt: ${prompt}
${metalType ? `Metal preference: ${metalType}` : ''}
${style ? `Style: ${style}` : ''}
${occasion ? `Occasion: ${occasion}` : ''}

Please provide 2-3 distinct jewellery design concepts.`;

    try {
      const completion = await getGroq().chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.8,
        max_tokens: 1024,
      });

      const ideas = completion.choices[0]?.message?.content || 'No ideas generated';

      return res.json({
        success: true,
        ideas,
        prompt,
        usage: completion.usage,
      });
    } catch (apiError) {
      return res.json({
        success: true,
        fallback: true,
        message: 'Groq is unavailable, so a local fallback design response was generated.',
        ideas: fallbackDesignIdeas({ prompt, metalType, style, occasion }),
        prompt,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/ai/chat
 * @desc    AI Business Chat Agent — fetches live data and answers questions
 * @access  Private
 */
const chatAgent = async (req, res, next) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Fetch live data from DB to give AI real context
    const [orders, inventory, workers] = await Promise.all([
      Order.find().populate('assignedWorker', 'name').lean(),
      Inventory.find().lean(),
      Worker.find().lean(),
    ]);

    // Compute business summaries
    const pendingOrders = orders.filter((o) => o.status === 'Pending');
    const inProgressOrders = orders.filter((o) => o.status === 'In Progress');
    const overdueOrders = orders.filter(
      (o) => new Date(o.dueDate) < new Date() && !['Completed', 'Cancelled'].includes(o.status)
    );
    const lowStockItems = inventory.filter((i) => i.quantity <= i.minStockLevel);
    const availableWorkers = workers.filter((w) => w.status === 'Available');

    // Build business context summary for LLM
    const businessContext = `
CURRENT BUSINESS DATA (as of ${new Date().toLocaleDateString()}):

ORDERS:
- Total orders: ${orders.length}
- Pending: ${pendingOrders.length} orders
- In Progress: ${inProgressOrders.length} orders
- Completed: ${orders.filter((o) => o.status === 'Completed').length} orders
- Overdue: ${overdueOrders.length} orders
${overdueOrders.length > 0 ? `- Overdue order details: ${overdueOrders.map((o) => `${o.orderNumber} (${o.customerName}, due ${new Date(o.dueDate).toLocaleDateString()})`).join(', ')}` : ''}
${pendingOrders.length > 0 ? `- Recent pending: ${pendingOrders.slice(0, 3).map((o) => `${o.orderNumber} for ${o.customerName}`).join(', ')}` : ''}

INVENTORY:
- Total items: ${inventory.length}
- Low stock alerts: ${lowStockItems.length} items
${lowStockItems.length > 0 ? `- Low stock: ${lowStockItems.map((i) => `${i.name} (${i.quantity} ${i.unit} left, min: ${i.minStockLevel})`).join(', ')}` : ''}

WORKERS:
- Total workers: ${workers.length}
- Available now: ${availableWorkers.length}
- Busy: ${workers.filter((w) => w.status === 'Busy').length}
- On leave: ${workers.filter((w) => w.status === 'On Leave').length}
${availableWorkers.length > 0 ? `- Available workers: ${availableWorkers.map((w) => `${w.name} (${w.specialization})`).join(', ')}` : ''}
`;

    const systemPrompt = `You are a smart business assistant for a jewellery manufacturing company. 
You have access to real-time data about orders, inventory, and workers.
Answer questions concisely and helpfully. Use the business data provided to give accurate answers.
If asked about specific orders, workers, or inventory, reference the actual data.
Keep responses professional and actionable.

${businessContext}`;

    // Build conversation for multi-turn chat
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message },
    ];

    try {
      const completion = await getGroq().chat.completions.create({
        model: MODEL,
        messages,
        temperature: 0.5,
        max_tokens: 512,
      });

      const reply = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

      return res.json({
        success: true,
        message: reply,
        usage: completion.usage,
      });
    } catch (apiError) {
      return res.json({
        success: true,
        fallback: true,
        message: fallbackChatReply({ message, orders, inventory, workers }),
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { generateDesign, chatAgent };
